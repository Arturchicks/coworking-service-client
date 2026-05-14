import {apiFetch} from '../../../shared/api'
import type {Subscription} from '../../../entities/subscription'


export function fetchMySubscriptions(): Promise<Subscription[]> {
	return apiFetch<Subscription[]>('/subscriptions/mine')
}
