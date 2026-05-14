import {Money} from '../shared/Money'


export type PaymentStatus = 'pending' | 'succeeded' | 'failed'

// На MVP единственный target — plan_purchase. Booking-charge не используется
// (бронь требует subscription, отдельной оплаты не делает).
export type PaymentTarget = 'plan_purchase'

// Payment — Aggregate Root. Хранит результат вызова PaymentProvider.
// CS-принцип: Audit Log — payment row создаётся ВНЕ зависимости от исхода (success/fail),
// чтобы потом отследить failed-попытки. Statuses 'pending'/'failed' тоже сохраняются.
export class Payment {
	private constructor(
		public readonly id: string,
		public readonly userId: string,
		public readonly amount: Money,
		public status: PaymentStatus,
		public readonly provider: string,
		public providerRef: string | null,
		public readonly targetType: PaymentTarget,
		public readonly targetId: string,
		public readonly createdAt: Date,
	) {}

	static createPending(props: {
		id: string
		userId: string
		amount: Money
		provider: string
		targetType: PaymentTarget
		targetId: string
		createdAt?: Date
	}): Payment {
		return new Payment(
			props.id,
			props.userId,
			props.amount,
			'pending',
			props.provider,
			null,
			props.targetType,
			props.targetId,
			props.createdAt ?? new Date(),
		)
	}

	static reconstitute(props: {
		id: string
		userId: string
		amount: Money
		status: PaymentStatus
		provider: string
		providerRef: string | null
		targetType: PaymentTarget
		targetId: string
		createdAt: Date
	}): Payment {
		return new Payment(
			props.id,
			props.userId,
			props.amount,
			props.status,
			props.provider,
			props.providerRef,
			props.targetType,
			props.targetId,
			props.createdAt,
		)
	}

	markSucceeded(providerRef: string): void {
		if (this.status !== 'pending') throw new Error('Payment: only pending can be marked succeeded')
		this.status = 'succeeded'
		this.providerRef = providerRef
	}

	markFailed(providerRef: string | null): void {
		if (this.status !== 'pending') throw new Error('Payment: only pending can be marked failed')
		this.status = 'failed'
		this.providerRef = providerRef
	}
}
