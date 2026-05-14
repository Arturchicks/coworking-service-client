import {PlanRepository} from '../../domain/plans/PlanRepository'
import {PlanDto, planToDto} from './dto/PlanDto'


export class ListPlansUseCase {
	constructor(private readonly plans: PlanRepository) {}

	async execute(): Promise<PlanDto[]> {
		const list = await this.plans.findAll()
		return list.map(planToDto)
	}
}
