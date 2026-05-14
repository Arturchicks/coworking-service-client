export type WorkspaceType = 'hot_desk' | 'meeting_room'

export interface Money {
	amountMinor: number
	currency: string
}

export interface Workspace {
	id: string
	name: string
	type: WorkspaceType
	capacity: number
	pricePerHour: Money
}

export function formatPrice(money: Money): string {
	const major = (money.amountMinor / 100).toLocaleString('ru-RU', {
		minimumFractionDigits: 0,
		maximumFractionDigits: 2,
	})
	return `${major} ${money.currency}`
}

export function workspaceTypeLabel(type: WorkspaceType): string {
	switch (type) {
		case 'hot_desk':
			return 'Hot desk'
		case 'meeting_room':
			return 'Переговорка'
	}
}
