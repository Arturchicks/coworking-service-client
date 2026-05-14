import {Workspace} from './Workspace'
import {TimeRange} from '../shared/TimeRange'


// Repository PORT (DDD): интерфейс лежит в `domain/`, реализация — в `infrastructure/persistence/`.
// CLAUDE.md DDD rule #2 + rule #6. CS-принцип: Dependency Inversion (SOLID DIP):
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
