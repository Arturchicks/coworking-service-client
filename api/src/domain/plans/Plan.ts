import {Money} from '../shared/Money'


export type PlanType = 'hours_pack' | 'unlimited_period'

// Plan — каталог тарифов. Read-mostly aggregate (на MVP админ-UI нет, plans живут в seed).
// CS-принцип: Information Expert (GRASP) — Plan знает, как из себя сделать Subscription.
export class Plan {
	private constructor(
		public readonly id: string,
		public readonly name: string,
		public readonly type: PlanType,
		public readonly includedHours: number | null,  // null для unlimited_period
		public readonly durationDays: number,
		public readonly price: Money,
	) {}

	static create(props: {
		id: string
		name: string
		type: PlanType
		includedHours: number | null
		durationDays: number
		price: Money
	}): Plan {
		if (!props.id) throw new Error('Plan: id required')
		if (!props.name.trim()) throw new Error('Plan: name required')
		if (props.durationDays < 1) throw new Error('Plan: durationDays must be >= 1')
		if (props.type === 'hours_pack') {
			if (props.includedHours === null || props.includedHours <= 0) {
				throw new Error('Plan: hours_pack requires positive includedHours')
			}
		} else {
			if (props.includedHours !== null) {
				throw new Error('Plan: unlimited_period must have includedHours=null')
			}
		}
		return new Plan(props.id, props.name, props.type, props.includedHours, props.durationDays, props.price)
	}
}
