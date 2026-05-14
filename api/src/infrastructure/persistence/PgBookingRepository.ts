import {DatabaseError, Pool} from 'pg'
import {Booking, BookingStatus} from '../../domain/bookings/Booking'
import {BookingOverlapError, BookingRepository} from '../../domain/bookings/BookingRepository'
import {Money} from '../../domain/shared/Money'
import {TimeRange} from '../../domain/shared/TimeRange'


// 23P01 — Postgres exclusion_violation. См. errcodes appendix.
const PG_EXCLUSION_VIOLATION = '23P01'

export class PgBookingRepository implements BookingRepository {
	constructor(private readonly pool: Pool) {}

	async save(booking: Booking): Promise<void> {
		const sql = `
			INSERT INTO bookings (id, workspace_id, user_id, starts_at, ends_at,
			                     total_price_minor, currency, status, created_at)
			VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
			ON CONFLICT (id) DO UPDATE SET status = EXCLUDED.status
		`
		const params = [
			booking.id,
			booking.workspaceId,
			booking.userId,
			booking.range.startsAt.toISOString(),
			booking.range.endsAt.toISOString(),
			booking.totalPrice.amountMinor,
			booking.totalPrice.currency,
			booking.status,
			booking.createdAt.toISOString(),
		]

		try {
			await this.pool.query(sql, params)
		} catch (err) {
			if (err instanceof DatabaseError && err.code === PG_EXCLUSION_VIOLATION) {
				throw new BookingOverlapError(booking.workspaceId)
			}
			throw err
		}
	}

	async findById(id: string): Promise<Booking | null> {
		const {rows} = await this.pool.query(
			`SELECT id, workspace_id, user_id, starts_at, ends_at,
			        total_price_minor, currency, status, created_at
			 FROM bookings WHERE id = $1`,
			[id],
		)
		if (rows.length === 0) return null
		return rowToBooking(rows[0])
	}

	async findByUserId(userId: string): Promise<Booking[]> {
		const {rows} = await this.pool.query(
			`SELECT id, workspace_id, user_id, starts_at, ends_at,
			        total_price_minor, currency, status, created_at
			 FROM bookings WHERE user_id = $1 ORDER BY starts_at DESC`,
			[userId],
		)
		return rows.map(rowToBooking)
	}
}

function rowToBooking(row: Record<string, unknown>): Booking {
	const status = row.status
	if (status !== 'active' && status !== 'cancelled') {
		throw new Error(`PgBookingRepository: invalid status from DB: ${String(status)}`)
	}
	return Booking.reconstitute({
		id: String(row.id),
		workspaceId: String(row.workspace_id),
		userId: String(row.user_id),
		range: TimeRange.create(toDate(row.starts_at), toDate(row.ends_at)),
		totalPrice: Money.fromMinor(Number(row.total_price_minor), String(row.currency)),
		status: status as BookingStatus,
		createdAt: toDate(row.created_at),
	})
}

function toDate(v: unknown): Date {
	if (v instanceof Date) return v
	return new Date(String(v))
}
