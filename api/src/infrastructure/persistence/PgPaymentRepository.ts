import {Pool} from 'pg'
import {Payment, PaymentStatus, PaymentTarget} from '../../domain/payments/Payment'
import {PaymentRepository} from '../../domain/payments/PaymentRepository'
import {Money} from '../../domain/shared/Money'


export class PgPaymentRepository implements PaymentRepository {
	constructor(private readonly pool: Pool) {}

	async save(payment: Payment): Promise<void> {
		// Upsert: INSERT для pending, UPDATE статуса при mark{Succeeded,Failed}.
		await this.pool.query(
			`INSERT INTO payments (id, user_id, amount_minor, currency, status,
			                      provider, provider_ref, target_type, target_id, created_at)
			 VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
			 ON CONFLICT (id) DO UPDATE
			 SET status = EXCLUDED.status,
			     provider_ref = EXCLUDED.provider_ref`,
			[
				payment.id,
				payment.userId,
				payment.amount.amountMinor,
				payment.amount.currency,
				payment.status,
				payment.provider,
				payment.providerRef,
				payment.targetType,
				payment.targetId,
				payment.createdAt.toISOString(),
			],
		)
	}

	async findById(id: string): Promise<Payment | null> {
		const {rows} = await this.pool.query(
			`SELECT id, user_id, amount_minor, currency, status,
			        provider, provider_ref, target_type, target_id, created_at
			 FROM payments WHERE id = $1`,
			[id],
		)
		if (rows.length === 0) return null
		const row = rows[0]
		const status = row.status
		if (status !== 'pending' && status !== 'succeeded' && status !== 'failed') {
			throw new Error(`PgPaymentRepository: invalid status: ${String(status)}`)
		}
		const targetType = row.target_type
		if (targetType !== 'plan_purchase') {
			throw new Error(`PgPaymentRepository: invalid target_type: ${String(targetType)}`)
		}
		return Payment.reconstitute({
			id: String(row.id),
			userId: String(row.user_id),
			amount: Money.fromMinor(Number(row.amount_minor), String(row.currency)),
			status: status as PaymentStatus,
			provider: String(row.provider),
			providerRef: row.provider_ref == null ? null : String(row.provider_ref),
			targetType: targetType as PaymentTarget,
			targetId: String(row.target_id),
			createdAt: row.created_at instanceof Date ? row.created_at : new Date(String(row.created_at)),
		})
	}
}
