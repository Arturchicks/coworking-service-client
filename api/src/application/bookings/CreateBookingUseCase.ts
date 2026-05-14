import {Booking} from '../../domain/bookings/Booking'
import {BookingRepository} from '../../domain/bookings/BookingRepository'
import {Money} from '../../domain/shared/Money'
import {TimeRange} from '../../domain/shared/TimeRange'
import {SubscriptionRepository} from '../../domain/subscriptions/SubscriptionRepository'
import {WorkspaceRepository} from '../../domain/workspaces/WorkspaceRepository'
import {BookingDto, bookingToDto} from './dto/BookingDto'
import {randomUUID} from 'node:crypto'


export class WorkspaceNotFoundError extends Error {
	constructor(id: string) {
		super(`Workspace not found: ${id}`)
		this.name = 'WorkspaceNotFoundError'
	}
}

// Доменная ошибка "у юзера нет подходящей подписки".
// Маппится в HTTP 402 Payment Required (RFC 7231 — semantic "purchase required").
export class SubscriptionRequiredError extends Error {
	constructor() {
		super('Active subscription required to book')
		this.name = 'SubscriptionRequiredError'
	}
}

export interface CreateBookingInput {
	workspaceId: string
	userId: string
	startsAt: string
	endsAt: string
}

// Booking-flow на MVP:
//   1. Парсим интервал → TimeRange.
//   2. Тащим workspace (404 если нет).
//   3. Тащим active subscriptions юзера. Ищем первую, что canCover(range.hours).
//   4. Если нет — 402 SubscriptionRequiredError ("купи план").
//   5. consume(hours) на subscription, save.
//   6. Создаём Booking (totalPrice = 0, потому что покрыто подпиской), save.
//      Booking всё ещё хранит "цену", но это 0 — для аудита можно потом завести
//      `originalPrice` / `paidAmount`. На MVP totalPrice=0.
//
// Tell-Don't-Ask: subscription.canCover решает; use case не вытаскивает поля и не решает сам.
// CS-принцип: правильное место invariant'а "не пересекается" — Postgres EXCLUDE constraint;
// "достаточно часов" — Subscription aggregate; "цена" — Workspace aggregate.
// Каждый aggregate отвечает за свой инвариант.
export class CreateBookingUseCase {
	constructor(
		private readonly bookings: BookingRepository,
		private readonly workspaces: WorkspaceRepository,
		private readonly subscriptions: SubscriptionRepository,
	) {}

	async execute(input: CreateBookingInput): Promise<BookingDto> {
		const range = TimeRange.create(new Date(input.startsAt), new Date(input.endsAt))

		const workspace = await this.workspaces.findById(input.workspaceId)
		if (!workspace) throw new WorkspaceNotFoundError(input.workspaceId)

		// Ищем подходящую подписку. На MVP алгоритм простой: первая, что canCover.
		// FLAG (future): если у юзера и hours_pack и unlimited_period — лучше тратить
		// hours_pack сначала (он ограничен). Сейчас sort = expiresAt ASC, может попасть unlimited.
		// Можно сделать sort: hours_pack-first, потом unlimited. На MVP пока не критично.
		const now = new Date()
		const subs = await this.subscriptions.findActiveByUserId(input.userId)
		const matched = subs.find((s) => s.canCover(range.hours, now))
		if (!matched) throw new SubscriptionRequiredError()

		matched.consume(range.hours)
		await this.subscriptions.save(matched)

		const booking = Booking.create({
			id: randomUUID(),
			workspaceId: workspace.id,
			userId: input.userId,
			range,
			totalPrice: Money.fromMinor(0, workspace.pricePerHour.currency),
		})
		// Если save упадёт на EXCLUDE constraint (409) — subscription уже consumer'нута.
		// FLAG (dual-write problem): в идеале — одна pg transaction для consume + insert booking.
		// Сейчас — accepted risk: юзер может потерять час подписки из-за collision'а. На MVP OK,
		// в проде — transactional Unit of Work.
		await this.bookings.save(booking)
		return bookingToDto(booking)
	}
}
