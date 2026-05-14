import {Plan, PlanType} from '../../../domain/plans/Plan'


export interface PlanDto {
	id: string
	name: string
	type: PlanType
	includedHours: number | null
	durationDays: number
	price: {amountMinor: number; currency: string}
}

export function planToDto(p: Plan): PlanDto {
	return {
		id: p.id,
		name: p.name,
		type: p.type,
		includedHours: p.includedHours,
		durationDays: p.durationDays,
		price: p.price.toJSON(),
	}
}
