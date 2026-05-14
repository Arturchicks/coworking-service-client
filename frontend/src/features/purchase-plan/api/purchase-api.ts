import {apiFetch} from '../../../shared/api'
import type {Subscription} from '../../../entities/subscription'


export function purchasePlan(planId: string): Promise<Subscription> {
	return apiFetch<Subscription>(`/plans/${planId}/purchase`, {method: 'POST'})
}
