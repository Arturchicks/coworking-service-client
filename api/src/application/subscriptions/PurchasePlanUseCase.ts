import {randomUUID} from 'node:crypto'
import {Payment} from '../../domain/payments/Payment'
import {PaymentProvider} from '../../domain/payments/PaymentProvider'
import {PaymentRepository} from '../../domain/payments/PaymentRepository'
import {PlanNotFoundError, PlanRepository} from '../../domain/plans/PlanRepository'
import {Subscription} from '../../domain/subscriptions/Subscription'
import {SubscriptionRepository} from '../../domain/subscriptions/SubscriptionRepository'
import {SubscriptionDto, subscriptionToDto} from './dto/SubscriptionDto'


export class PaymentFailedError extends Error {
	constructor(providerRef: string | null) {
		super(`Payment failed${providerRef ? ` (ref=${providerRef})` : ''}`)
		this.name = 'PaymentFailedError'
	}
}

export interface PurchasePlanInput {
	planId: string
	userId: string
}

// Use case "купить тариф".
// Шаги:
//   1. Найти Plan по id (404 если нет).
//   2. Создать pending Payment record (для audit log — фиксируем попытку до запроса к провайдеру).
//   3. Зайти к PaymentProvider.charge(price, idempotencyKey=paymentId).
//   4. Если succeeded → markSucceeded + создать Subscription (status='active', expiresAt=now+plan.durationDays).
//   5. Если failed → markFailed → бросить PaymentFailedError (для UI 402).
//
// CS-принципы:
//   - Audit Log: payment row создаётся всегда, даже при failure (forensics).
//   - Composition Root (server.ts) внедряет MockPaymentProvider или реальный.
//   - Идемпотентность через paymentId — retry той же транзакции у провайдера не списывает дважды.
//
// FLAG: на MVP нет полноценной транзакции (две таблицы — subscriptions + payments).
// Если subscription save упадёт после успешного charge — payment уже succeeded, но subscription
// не создалась. Это известный класс проблем "dual-write". Лечится: outbox pattern,
// либо явный pg transaction (BEGIN; INSERT payment; CALL provider; INSERT subscription; COMMIT).
// На MVP — accepted-risk, в реальной системе — обязательная задача.
export class PurchasePlanUseCase {
	constructor(
		private readonly plans: PlanRepository,
		private readonly subs: SubscriptionRepository,
		private readonly payments: PaymentRepository,
		private readonly provider: PaymentProvider,
	) {}

	async execute(input: PurchasePlanInput): Promise<SubscriptionDto> {
		const plan = await this.plans.findById(input.planId)
		if (!plan) throw new PlanNotFoundError(input.planId)

		// 1. Записываем pending Payment (audit log "юзер попытался купить план X").
		const paymentId = randomUUID()
		const payment = Payment.createPending({
			id: paymentId,
			userId: input.userId,
			amount: plan.price,
			provider: 'mock',
			targetType: 'plan_purchase',
			targetId: plan.id,
		})
		await this.payments.save(payment)

		// 2. Заявка в эквайринг. На MVP mock-провайдер всегда возвращает succeeded.
		const result = await this.provider.charge(plan.price, paymentId)

		// 3. Обновляем payment-row.
		if (result.status === 'failed') {
			payment.markFailed(result.providerRef)
			await this.payments.save(payment)
			throw new PaymentFailedError(result.providerRef)
		}
		payment.markSucceeded(result.providerRef)
		await this.payments.save(payment)

		// 4. Создаём Subscription. fromPlan вычисляет expiresAt и hoursRemaining.
		const sub = Subscription.fromPlan({
			id: randomUUID(),
			userId: input.userId,
			plan,
			now: new Date(),
		})
		await this.subs.save(sub)

		return subscriptionToDto(sub)
	}
}
