import {Pool} from 'pg'
import {Plan, PlanType} from '../../domain/plans/Plan'
import {PlanRepository} from '../../domain/plans/PlanRepository'
import {Money} from '../../domain/shared/Money'


export class PgPlanRepository implements PlanRepository {
	constructor(private readonly pool: Pool) {}

	async findAll(): Promise<Plan[]> {
		const {rows} = await this.pool.query(
			`SELECT id, name, type, included_hours, duration_days, price_minor, currency
			 FROM plans ORDER BY price_minor ASC`,
		)
		return rows.map(rowToPlan)
	}

	async findById(id: string): Promise<Plan | null> {
		const {rows} = await this.pool.query(
			`SELECT id, name, type, included_hours, duration_days, price_minor, currency
			 FROM plans WHERE id = $1`,
			[id],
		)
		if (rows.length === 0) return null
		return rowToPlan(rows[0])
	}
}

function rowToPlan(row: Record<string, unknown>): Plan {
	const type = row.type
	if (type !== 'hours_pack' && type !== 'unlimited_period') {
		throw new Error(`PgPlanRepository: invalid plan.type from DB: ${String(type)}`)
	}
	return Plan.create({
		id: String(row.id),
		name: String(row.name),
		type: type as PlanType,
		// included_hours nullable. row.included_hours может быть null или number.
		includedHours: row.included_hours == null ? null : Number(row.included_hours),
		durationDays: Number(row.duration_days),
		price: Money.fromMinor(Number(row.price_minor), String(row.currency)),
	})
}
