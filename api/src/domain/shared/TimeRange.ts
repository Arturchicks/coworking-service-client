// Value Object — DDD: immutable, equality by value, не имеет identity.
// CLAUDE.md DDD rule #5: Value Objects immutable, equality structural.
//
// TimeRange защищает инвариант "starts < ends" в одном месте — конструктор-валидатор.
// Без VO эта проверка размазывается по use cases / роутерам / репозиториям → DRY-нарушение.
//
// CS-принцип: Single Source of Truth для правила "интервал валиден".
// Применимый паттерн: Value Object (DDD), Constructor-as-Validator (Fail-Fast).
export class TimeRange {
	// `private` конструктор + статический `create` — Factory Method (GoF).
	// Зачем не публичный: `new TimeRange(...)` обошёл бы валидацию, если кто-то
	// случайно подставит невалидные значения. Через factory — единственный путь
	// создания, валидация гарантирована.
	private constructor(
		public readonly startsAt: Date,
		public readonly endsAt: Date,
	) {}

	static create(startsAt: Date, endsAt: Date): TimeRange {
		// Fail-Fast: бросаем при невалидных данных, а не возвращаем "пустой" объект.
		// Невалидный TimeRange не должен существовать в системе — это инвариант VO.
		if (!(startsAt instanceof Date) || isNaN(startsAt.getTime())) {
			throw new Error('TimeRange: startsAt must be a valid Date')
		}
		if (!(endsAt instanceof Date) || isNaN(endsAt.getTime())) {
			throw new Error('TimeRange: endsAt must be a valid Date')
		}
		if (startsAt.getTime() >= endsAt.getTime()) {
			throw new Error('TimeRange: startsAt must be strictly before endsAt')
		}
		return new TimeRange(startsAt, endsAt)
	}

	// Длительность интервала. Используется для расчёта стоимости брони.
	get hours(): number {
		const ms = this.endsAt.getTime() - this.startsAt.getTime()
		return ms / (1000 * 60 * 60)
	}

	// Структурное равенство — две TimeRange равны, если совпадают границы.
	// DDD: VO equal by value, не по reference (две `new Date(...)` с одной datestring — !==).
	equals(other: TimeRange): boolean {
		return this.startsAt.getTime() === other.startsAt.getTime()
			&& this.endsAt.getTime() === other.endsAt.getTime()
	}

	// Используется только в тестах/логах; в проде интервал лежит в БД как tstzrange.
	overlaps(other: TimeRange): boolean {
		// Open intervals: соприкасающиеся [10:00–11:00) и [11:00–12:00) НЕ пересекаются.
		// Это согласуется с tstzrange '[)' в Postgres.
		return this.startsAt < other.endsAt && this.endsAt > other.startsAt
	}
}
