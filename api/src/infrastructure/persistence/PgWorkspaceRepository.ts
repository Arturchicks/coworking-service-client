import {Pool} from 'pg'
import {Money} from '../../domain/shared/Money'
import {TimeRange} from '../../domain/shared/TimeRange'
import {Workspace} from '../../domain/workspaces/Workspace'
import {WorkspaceRepository} from '../../domain/workspaces/WorkspaceRepository'
import {isWorkspaceType} from '../../domain/workspaces/WorkspaceType'


// Адаптер для порта WorkspaceRepository.
// CS-принцип: Ports & Adapters / Hexagonal Architecture — Pg-специфика инкапсулирована здесь.
export class PgWorkspaceRepository implements WorkspaceRepository {
	constructor(private readonly pool: Pool) {}

	async findAll(): Promise<Workspace[]> {
		// Параметризованные запросы (через $1, $2) — стандартная защита от SQL injection.
		// pg-клиент шлёт SQL и parameters отдельно (Postgres extended-query protocol),
		// строки никогда не конкатенируются в SQL-text. Источник: https://node-postgres.com/features/queries
		const {rows} = await this.pool.query(
			'SELECT id, name, type, capacity, price_per_hour_minor, currency FROM workspaces ORDER BY name',
		)
		return rows.map(rowToWorkspace)
	}

	async findById(id: string): Promise<Workspace | null> {
		const {rows} = await this.pool.query(
			'SELECT id, name, type, capacity, price_per_hour_minor, currency FROM workspaces WHERE id = $1',
			[id],
		)
		if (rows.length === 0) return null
		return rowToWorkspace(rows[0])
	}

	async findAvailable(range: TimeRange): Promise<Workspace[]> {
		// Tell-Don't-Ask: SQL делает join+anti-join, не тащим все в память.
		// tstzrange '[)' — half-open interval (включает starts_at, исключает ends_at).
		// && — оператор пересечения двух range-ов в Postgres.
		// EXISTS-subquery с NOT — anti-join, "у которых нет пересекающейся active брони".
		const sql = `
			SELECT w.id, w.name, w.type, w.capacity, w.price_per_hour_minor, w.currency
			FROM workspaces w
			WHERE NOT EXISTS (
				SELECT 1 FROM bookings b
				WHERE b.workspace_id = w.id
				  AND b.status = 'active'
				  AND tstzrange(b.starts_at, b.ends_at, '[)') && tstzrange($1::timestamptz, $2::timestamptz, '[)')
			)
			ORDER BY w.name
		`
		const {rows} = await this.pool.query(sql, [range.startsAt.toISOString(), range.endsAt.toISOString()])
		return rows.map(rowToWorkspace)
	}
}

// Маппер row → entity. Изолирован — если изменится схема БД, правка тут, не в каждом методе.
// CS-принцип: Single Responsibility (один маппер на одну таблицу).
// Anti-Corruption Layer: ловим невалидные данные из БД (type guard на enum).
function rowToWorkspace(row: Record<string, unknown>): Workspace {
	const type = row.type
	if (!isWorkspaceType(type)) {
		// бросаем — пусть лог покажет corruption.
		throw new Error(`PgWorkspaceRepository: invalid workspace.type from DB: ${String(type)}`)
	}
	return Workspace.create({
		id: String(row.id),
		name: String(row.name),
		type,
		capacity: Number(row.capacity),
		pricePerHour: Money.fromMinor(Number(row.price_per_hour_minor), String(row.currency)),
	})
}
