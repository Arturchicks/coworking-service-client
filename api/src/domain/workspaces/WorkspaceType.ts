// Domain enum через union type — TS-идиома "tagged union" / "discriminated union".
// Альтернатива: `enum WorkspaceType { HotDesk, MeetingRoom }`. Trade-off:
//   - enum транспилируется в объект runtime — лишний JS bundle на фронте.
//   - const-union — zero-cost, чисто type-level.
// Convention в TS-сообществе сместилась к union-type. Источник: Effective TypeScript (Vanderkam).
export type WorkspaceType = 'hot_desk' | 'meeting_room'

// Type guard для рантайма (парсинг JSON из БД/HTTP, где TS не помогает).
// CS-принцип: Anti-Corruption Layer — внешние данные проходят через явный validator.
export function isWorkspaceType(value: unknown): value is WorkspaceType {
	return value === 'hot_desk' || value === 'meeting_room'
}
