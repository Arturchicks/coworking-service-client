import {Money} from '../shared/Money'


// Port для внешнего эквайринга (Stripe / ЮKassa / Тинькофф / mock).
// CS-принцип: Hexagonal Architecture / Ports & Adapters.
// Use case дёргает этот port; конкретная реализация выбирается в Composition Root.
//
// `idempotencyKey` — стандартный banking-pattern. Если retry'нем запрос с тем же ключом,
// провайдер не списывает дважды. Mock-провайдер на MVP ignore'ит, но интерфейс готов.
export interface ChargeResult {
	status: 'succeeded' | 'failed'
	providerRef: string  // ID транзакции у провайдера (для аудита/refund'а)
}

export interface PaymentProvider {
	charge(amount: Money, idempotencyKey: string): Promise<ChargeResult>
}
