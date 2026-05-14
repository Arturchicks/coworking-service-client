import {Plan} from './Plan'


export class PlanNotFoundError extends Error {
	constructor(id: string) {
		super(`Plan not found: ${id}`)
		this.name = 'PlanNotFoundError'
	}
}

export interface PlanRepository {
	findAll(): Promise<Plan[]>
	findById(id: string): Promise<Plan | null>
}
