import {Money} from '../shared/Money'
import {TimeRange} from '../shared/TimeRange'


export type BookingStatus = 'active' | 'cancelled'

// Aggregate Root (DDD): consistency boundary. Booking защищает инвариант
// "интервал валиден + total посчитан корректно".
// Инвариант "не пересекается с другими бронированиями того же workspace" —
// НЕ-локальный (требует знания других Booking'ов того же workspace),
// поэтому защищается на уровне Repository + БД-constraint (EXCLUDE USING gist),
// а не внутри этой entity.
//
// После Stage 1 (Auth) `userEmail` заменён на `userId` (UUID, FK на users.id) —
// строгая связь с registered user. Email хранится в users, не дублируется здесь.
export class Booking {
	private constructor(
		public readonly id: string,
		public readonly workspaceId: string,
		public readonly userId: string,
		public readonly range: TimeRange,
		public readonly totalPrice: Money,
		public status: BookingStatus,
		public readonly createdAt: Date,
	) {}

	static create(props: {
		id: string
		workspaceId: string
		userId: string
		range: TimeRange
		totalPrice: Money
		createdAt?: Date
	}): Booking {
		if (!props.id) throw new Error('Booking: id required')
		if (!props.workspaceId) throw new Error('Booking: workspaceId required')
		if (!props.userId) throw new Error('Booking: userId required')
		return new Booking(
			props.id,
			props.workspaceId,
			props.userId,
			props.range,
			props.totalPrice,
			'active',
			props.createdAt ?? new Date(),
		)
	}

	// Reconstitution — отдельная фабрика "из БД", без перевалидации.
	static reconstitute(props: {
		id: string
		workspaceId: string
		userId: string
		range: TimeRange
		totalPrice: Money
		status: BookingStatus
		createdAt: Date
	}): Booking {
		return new Booking(
			props.id,
			props.workspaceId,
			props.userId,
			props.range,
			props.totalPrice,
			props.status,
			props.createdAt,
		)
	}

	cancel(): void {
		if (this.status === 'cancelled') throw new Error('Booking: already cancelled')
		this.status = 'cancelled'
	}
}
