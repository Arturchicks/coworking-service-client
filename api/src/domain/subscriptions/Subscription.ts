import {Plan} from '../plans/Plan'


export type SubscriptionStatus = 'active' | 'expired' | 'exhausted'

// Subscription — Aggregate Root.
// Защищает инварианты:
//   - hoursRemaining не уходит в минус;
//   - status переходит атомарно при exhausted/expired;
//   - canCover решает, покрывает ли бронь данной длительности.
// CS-принцип: Tell-Don't-Ask (use case говорит sub.consume(hours), не вытаскивает поля и решает снаружи).
export class Subscription {
	private constructor(
		public readonly id: string,
		public readonly userId: string,
		public readonly planId: string,
		public hoursRemaining: number | null,  // null для unlimited_period
		public readonly expiresAt: Date,
		public status: SubscriptionStatus,
		public readonly createdAt: Date,
	) {}

	// Factory "из Plan + now()". Считает expiresAt = now + plan.durationDays.
	// CS-принцип: Information Expert — Plan знает свою длительность, мы её используем здесь.
	static fromPlan(props: {id: string; userId: string; plan: Plan; now: Date}): Subscription {
		const expiresAt = new Date(props.now.getTime() + props.plan.durationDays * 24 * 60 * 60 * 1000)
		return new Subscription(
			props.id,
			props.userId,
			props.plan.id,
			props.plan.includedHours, // null для unlimited
			expiresAt,
			'active',
			props.now,
		)
	}

	static reconstitute(props: {
		id: string
		userId: string
		planId: string
		hoursRemaining: number | null
		expiresAt: Date
		status: SubscriptionStatus
		createdAt: Date
	}): Subscription {
		return new Subscription(
			props.id,
			props.userId,
			props.planId,
			props.hoursRemaining,
			props.expiresAt,
			props.status,
			props.createdAt,
		)
	}

	// canCover: покрывает ли подписка booking длительностью `hours` "на момент `now`".
	// `now` передаётся снаружи — Clock-зависимость через параметр (testability + Referential Transparency).
	canCover(hours: number, now: Date): boolean {
		if (this.status !== 'active') return false
		if (now.getTime() >= this.expiresAt.getTime()) return false
		if (this.hoursRemaining === null) return true // unlimited
		return this.hoursRemaining >= hours
	}

	// consume: списать часы (для hours_pack). Если стало 0 — exhausted.
	// FLAG: для unlimited_period — no-op (нечего списывать). Принципиально не бросаем,
	// потому что use case может вызывать consume() единообразно, не разветвляя по типу.
	consume(hours: number): void {
		if (this.hoursRemaining === null) return
		if (hours > this.hoursRemaining) throw new Error('Subscription: not enough hours remaining')
		this.hoursRemaining -= hours
		if (this.hoursRemaining === 0) this.status = 'exhausted'
	}
}
