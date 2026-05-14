import {TimeRange} from '../../domain/shared/TimeRange'
import {WorkspaceRepository} from '../../domain/workspaces/WorkspaceRepository'
import {WorkspaceDto, workspaceToDto} from './dto/WorkspaceDto'


export interface CheckAvailabilityInput {
	startsAt: string // ISO 8601
	endsAt: string
}

// Use case "какие места свободны на интервал".
// Делегирует поиск пересечений в репозиторий (Tell-Don't-Ask) — не тащим все bookings в память.
export class CheckAvailabilityUseCase {
	constructor(private readonly workspaces: WorkspaceRepository) {}

	async execute(input: CheckAvailabilityInput): Promise<WorkspaceDto[]> {
		// Anti-Corruption Layer: входящий JSON — строки. Парсим в Date и валидируем
		// через TimeRange.create (Fail-Fast). Если строки невалидны — бросаем доменную ошибку,
		// HTTP-слой превратит в 400.
		const range = TimeRange.create(new Date(input.startsAt), new Date(input.endsAt))
		const available = await this.workspaces.findAvailable(range)
		return available.map(workspaceToDto)
	}
}
