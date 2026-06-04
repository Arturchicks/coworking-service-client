import {Workspace} from '../../../domain/workspaces/Workspace'
import {WorkspaceType} from '../../../domain/workspaces/WorkspaceType'


// DTO — плоский контракт application → внешний мир.
// CS-принцип: Separation of Concerns (transfer vs domain).
export interface WorkspaceDto {
	id: string
	name: string
	type: WorkspaceType
	capacity: number
	pricePerHour: {amountMinor: number; currency: string}
}

// Маппер entity → DTO. Изолирован в DTO-модуле — если меняется форма DTO,
// касается одного файла, не всех use cases.
export function workspaceToDto(w: Workspace): WorkspaceDto {
	return {
		id: w.id,
		name: w.name,
		type: w.type,
		capacity: w.capacity,
		pricePerHour: w.pricePerHour.toJSON(),
	}
}
