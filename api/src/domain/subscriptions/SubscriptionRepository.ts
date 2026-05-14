import {Subscription} from './Subscription'


export interface SubscriptionRepository {
	save(sub: Subscription): Promise<void>
	findById(id: string): Promise<Subscription | null>
	// Все active подписки юзера, отсортированы по expiresAt ASC.
	// expired/exhausted фильтруются на уровне SQL (DB-level scan по индексу).
	findActiveByUserId(userId: string): Promise<Subscription[]>
	// Включая expired/exhausted, для UI "история подписок".
	findAllByUserId(userId: string): Promise<Subscription[]>
}
