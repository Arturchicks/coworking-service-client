import {SubscriptionRepository} from '../../domain/subscriptions/SubscriptionRepository'
import {SubscriptionDto, subscriptionToDto} from './dto/SubscriptionDto'


export class ListMySubscriptionsUseCase {
	constructor(private readonly subs: SubscriptionRepository) {}

	async execute(userId: string): Promise<SubscriptionDto[]> {
		const list = await this.subs.findAllByUserId(userId)
		return list.map(subscriptionToDto)
	}
}
