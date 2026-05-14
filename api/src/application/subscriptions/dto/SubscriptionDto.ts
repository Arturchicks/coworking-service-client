import {Subscription, SubscriptionStatus} from '../../../domain/subscriptions/Subscription'


export interface SubscriptionDto {
	id: string
	userId: string
	planId: string
	hoursRemaining: number | null
	expiresAt: string
	status: SubscriptionStatus
	createdAt: string
}

export function subscriptionToDto(s: Subscription): SubscriptionDto {
	return {
		id: s.id,
		userId: s.userId,
		planId: s.planId,
		hoursRemaining: s.hoursRemaining,
		expiresAt: s.expiresAt.toISOString(),
		status: s.status,
		createdAt: s.createdAt.toISOString(),
	}
}
