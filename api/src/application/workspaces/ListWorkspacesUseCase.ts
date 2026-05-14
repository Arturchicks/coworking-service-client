import {WorkspaceRepository} from '../../domain/workspaces/WorkspaceRepository'
import {WorkspaceDto, workspaceToDto} from './dto/WorkspaceDto'


// Use Case — оркестрирует один user-сценарий "список рабочих мест".
// CLAUDE.md DDD rule #3: input/output — plain DTO, никаких req/res.
//
// CS-принцип: Single Responsibility (SOLID SRP) — этот класс знает только про
// "вытащить список и сериализовать". Если завтра добавится фильтрация по типу,
// она войдёт сюда (в DTO), а не в роутер.
export class ListWorkspacesUseCase {
	// Constructor Injection — стандартный способ DI без контейнера.
	// Зависимость — на интерфейс репозитория из domain/, не на Pg-реализацию (DDD rule #6).
	constructor(private readonly workspaces: WorkspaceRepository) {}

	async execute(): Promise<WorkspaceDto[]> {
		const list = await this.workspaces.findAll()
		// Маппинг entity → DTO в одном месте (см. WorkspaceDto.ts). Это Anti-Corruption Layer
		// со стороны исходящего трафика: внутри домена ходит Workspace, наружу — плоский DTO.
		return list.map(workspaceToDto)
	}
}
