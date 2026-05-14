import {randomUUID} from 'node:crypto'
import {ChargeResult, PaymentProvider} from '../../domain/payments/PaymentProvider'
import {Money} from '../../domain/shared/Money'


// Mock-эквайринг для MVP. Всегда возвращает succeeded (или failed, если включён failure-mode).
// Идемпотентность через idempotencyKey: один и тот же ключ возвращает one and only one result.
// (В реальном Stripe/ЮKassa это поведение — стандарт. Mock эмулирует.)
//
// CS-принцип: Liskov Substitution (SOLID LSP) — MockPaymentProvider может быть заменён
// на реальный StripePaymentProvider без правок в use case. Контракт PaymentProvider общий.
export class MockPaymentProvider implements PaymentProvider {
	// Сохраняем результаты по idempotency-ключу. В реальном провайдере это делает их сервер;
	// у mock'а — в памяти процесса (потеряем при рестарте, но это тестовая инфра).
	private readonly history = new Map<string, ChargeResult>()

	// failureMode: true → всегда failed. Управляется ENV (см. env.ts) для теста failure-path.
	constructor(private readonly failureMode: boolean = false) {}

	async charge(_amount: Money, idempotencyKey: string): Promise<ChargeResult> {
		const existing = this.history.get(idempotencyKey)
		if (existing) return existing

		// Эмулируем задержку реального эквайринга (200ms). Полезно для тестов UI-loading.
		await new Promise((resolve) => setTimeout(resolve, 200))

		const result: ChargeResult = this.failureMode
			? {status: 'failed', providerRef: `mock_decline_${randomUUID()}`}
			: {status: 'succeeded', providerRef: `mock_ok_${randomUUID()}`}

		this.history.set(idempotencyKey, result)
		return result
	}
}
