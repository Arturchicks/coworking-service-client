import {Pool} from 'pg'
import {Subscription, SubscriptionStatus} from '../../domain/subscriptions/Subscription'
import {SubscriptionRepository} from '../../domain/subscriptions/SubscriptionRepository'


export class PgSubscriptionRepository implements SubscriptionRepository {
	constructor(private readonly pool: Pool) {}

	async save(sub: Subscription): Promise<void> {
		// Upsert: INSERT для нового, UPDATE для consume()/markExpired.
		// ON CONFLICT (id) DO UPDATE — обновляет mutable поля.
		const sql = `
			INSERT INTO subscriptions (id, user_id, plan_id, hours_remaining, expires_at, status, created_at)
			VALUES ($1, $2, $3, $4, $5, $6, $7)
			ON CONFLICT (id) DO UPDATE
			SET hours_remaining = EXCLUDED.hours_remaining,
			    status = EXCLUDED.status
		`
		await this.pool.query(sql, [
			sub.id,
			sub.userId,
			sub.planId,
			sub.hoursRemaining,
			sub.expiresAt.toISOString(),
			sub.status,
			sub.createdAt.toISOString(),
		])
	}

	async findById(id: string): Promise<Subscription | null> {
		const {rows} = await this.pool.query(
			`SELECT id, user_id, plan_id, hours_remaining, expires_at, status, created_at
			 FROM subscriptions WHERE id = $1`,
			[id],
		)
		if (rows.length === 0) return null
		return rowToSub(rows[0])
	}

	async findActiveByUserId(userId: string): Promise<Subscription[]> {
		// Не доверяем status alone — expires_at тоже проверяем (юзер мог не зайти месяц,
		// никто не пометил expired, реальный invariant сейчас по времени).
		// CS-принцип: Defense in Depth — проверяем status И expires_at, не только одно.
		const {rows} = await this.pool.query(
			`SELECT id, user_id, plan_id, hours_remaining, expires_at, status, created_at
			 FROM subscriptions
			 WHERE user_id = $1 AND status = 'active' AND expires_at > NOW()
			 ORDER BY expires_at ASC`,
			[userId],
		)
		return rows.map(rowToSub)
	}

	async findAllByUserId(userId: string): Promise<Subscription[]> {
		const {rows} = await this.pool.query(
			`SELECT id, user_id, plan_id, hours_remaining, expires_at, status, created_at
			 FROM subscriptions WHERE user_id = $1 ORDER BY created_at DESC`,
			[userId],
		)
		return rows.map(rowToSub)
	}
}

function rowToSub(row: Record<string, unknown>): Subscription {
	const status = row.status
	if (status !== 'active' && status !== 'expired' && status !== 'exhausted') {
		throw new Error(`PgSubscriptionRepository: invalid status: ${String(status)}`)
	}
	return Subscription.reconstitute({
		id: String(row.id),
		userId: String(row.user_id),
		planId: String(row.plan_id),
		hoursRemaining: row.hours_remaining == null ? null : Number(row.hours_remaining),
		expiresAt: toDate(row.expires_at),
		status: status as SubscriptionStatus,
		createdAt: toDate(row.created_at),
	})
}

function toDate(v: unknown): Date {
	if (v instanceof Date) return v
	return new Date(String(v))
}
