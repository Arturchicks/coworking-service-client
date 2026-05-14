import type {Money} from '../../workspace'


export type BookingStatus = 'active' | 'cancelled'

export interface Booking {
	id: string
	workspaceId: string
	userId: string
	startsAt: string
	endsAt: string
	totalPrice: Money
	status: BookingStatus
	createdAt: string
}

export function formatInterval(b: Pick<Booking, 'startsAt' | 'endsAt'>): string {
	const start = new Date(b.startsAt)
	const end = new Date(b.endsAt)
	const fmt = new Intl.DateTimeFormat('ru-RU', {
		dateStyle: 'medium',
		timeStyle: 'short',
	})
	return `${fmt.format(start)} — ${fmt.format(end)}`
}
