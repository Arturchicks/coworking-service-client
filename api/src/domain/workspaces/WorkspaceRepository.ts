import {TimeRange} from '../shared/TimeRange'
import {Workspace} from './Workspace'


// Repository PORT (DDD): интерфейс лежит в `domain/`, реализация — в `infrastructure/persistence/`.
// высокоуровневый use case зависит от абстракции, а не от конкретного `pg`-клиента.
//
// Применимый паттерн: Repository (Evans, DDD) / Ports & Adapters (Hexagonal Architecture, Cockburn).
export interface WorkspaceRepository {
	findAll(): Promise<Workspace[]>
	findById(id: string): Promise<Workspace | null>
	// Возвращает workspaces, у которых НЕТ пересекающихся бронирований в интервале `range`.
	// Семантически это "join workspaces ⨉ bookings, отфильтровать". Логично положить
	// сюда (а не в BookingRepository), потому что "результат — Workspace[]".
	// Tell-Don't-Ask: use case спрашивает "кто свободен", не вытаскивает все workspaces
	// и все bookings и не считает пересечения в коде.
	findAvailable(range: TimeRange): Promise<Workspace[]>
}
