import {apiFetch} from '../../../shared/api'
import type {Plan} from '../../../entities/plan'


export function fetchPlans(): Promise<Plan[]> {
	return apiFetch<Plan[]>('/plans')
}
