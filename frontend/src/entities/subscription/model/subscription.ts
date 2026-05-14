export type SubscriptionStatus = 'active' | 'expired' | 'exhausted'

export interface Subscription {
	id: string
	userId: string
	planId: string
	hoursRemaining: number | null
	expiresAt: string
	status: SubscriptionStatus
	createdAt: string
}

export function subscriptionStatusLabel(s: SubscriptionStatus): string {
	switch (s) {
		case 'active':
			return 'активна'
		case 'expired':
			return 'истекла'
		case 'exhausted':
			return 'часы исчерпаны'
	}
}

export function formatExpiry(iso: string): string {
	return new Intl.DateTimeFormat('ru-RU', {dateStyle: 'medium', timeStyle: 'short'}).format(new Date(iso))
}
