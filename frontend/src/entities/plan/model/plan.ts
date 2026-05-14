import type {Money} from '../../workspace'


export type PlanType = 'hours_pack' | 'unlimited_period'

export interface Plan {
	id: string
	name: string
	type: PlanType
	includedHours: number | null
	durationDays: number
	price: Money
}

export function planTypeLabel(type: PlanType): string {
	switch (type) {
		case 'hours_pack':
			return 'Пакет часов'
		case 'unlimited_period':
			return 'Безлимит на период'
	}
}
