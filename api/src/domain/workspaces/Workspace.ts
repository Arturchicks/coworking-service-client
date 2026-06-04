import {Money} from '../shared/Money'
import {WorkspaceType} from './WorkspaceType'


// Entity — DDD: identity-based объект (равен другому, если совпадает id).
//
// Здесь Workspace максимально близко к "плотскому" описанию: имя, тип, капасити, цена.
// На MVP нет mutating-операций (переименовать, изменить цену) — Workspace ведёт себя
// почти как immutable. Если/когда появятся такие методы — они приедут сюда.
//
// CS-принцип: Information Expert (GRASP) — Workspace знает свою цену и считает стоимость
// для интервала. Use case НЕ должен делать `workspace.pricePerHour.multiply(hours)`:
// это leaky abstraction (use case знает внутреннюю формулу). Вместо — `workspace.calculatePrice(range)`.
export class Workspace {
	private constructor(
		public readonly id: string,
		public readonly name: string,
		public readonly type: WorkspaceType,
		public readonly capacity: number,
		public readonly pricePerHour: Money,
	) {}

	// Factory с валидацией инвариантов. На MVP минимум: capacity > 0, name непустое.
	static create(props: {
		id: string
		name: string
		type: WorkspaceType
		capacity: number
		pricePerHour: Money
	}): Workspace {
		if (!props.id) throw new Error('Workspace: id required')
		if (!props.name.trim()) throw new Error('Workspace: name must be non-empty')
		// hot_desk — одно место (capacity=1). meeting_room — больше.
		// Не enforce'им через тип в TS, чтобы домен оставался гибким для будущих типов.
		if (!Number.isInteger(props.capacity) || props.capacity < 1) {
			throw new Error('Workspace: capacity must be positive integer')
		}
		return new Workspace(props.id, props.name, props.type, props.capacity, props.pricePerHour)
	}

	// Tell-Don't-Ask (CS): говорим Workspace'у "посчитай цену для этого интервала",
	// не вытаскиваем `pricePerHour` и не считаем снаружи.
	calculatePrice(hours: number): Money {
		if (hours <= 0) throw new Error('Workspace.calculatePrice: hours must be positive')
		return this.pricePerHour.multiply(hours)
	}
}
