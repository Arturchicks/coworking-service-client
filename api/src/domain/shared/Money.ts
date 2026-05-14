// Money — Value Object для денежных сумм.
// CS-принципы: Immutability, Encapsulation, Fail-Fast.
//
// Почему хранить cents (integer), а НЕ float "rubles":
// JavaScript Number = IEEE 754 double. 0.1 + 0.2 !== 0.3. Для денег это катастрофа:
// округление накапливается, итого баланс расходится с источником истины.
// Industry-standard: хранить минорные единицы (cents/копейки) в integer (или string/decimal).
// Источник: https://martinfowler.com/eaaCatalog/money.html (Money pattern, Fowler).
export class Money {
	private constructor(
		public readonly amountMinor: number, // в копейках (или центах для USD)
		public readonly currency: string,    // ISO 4217: "RUB", "USD"
	) {}

	static fromMinor(amountMinor: number, currency: string = 'RUB'): Money {
		if (!Number.isInteger(amountMinor)) {
			throw new Error('Money: amountMinor must be an integer (use minor units like kopecks)')
		}
		if (amountMinor < 0) {
			throw new Error('Money: amountMinor must be non-negative')
		}
		if (currency.length !== 3) {
			throw new Error('Money: currency must be a 3-letter ISO code')
		}
		return new Money(amountMinor, currency.toUpperCase())
	}

	// Удобная фабрика "из числа основных единиц" — для конструирования из конфига/UI.
	// FLAG: parseFloat-вход уязвим к ошибкам округления. Поэтому Math.round.
	static fromMajor(amountMajor: number, currency: string = 'RUB'): Money {
		return Money.fromMinor(Math.round(amountMajor * 100), currency)
	}

	multiply(factor: number): Money {
		// Округление к ближайшему минору — стандарт банкинга. Для коворкинга
		// (заказ на 1.5 часа × 200 руб = 300 руб) точное значение, но при
		// 1.33 часа × 250 = 332.50 — Math.round даст 333 руб 00 коп. Это OK для MVP.
		return Money.fromMinor(Math.round(this.amountMinor * factor), this.currency)
	}

	equals(other: Money): boolean {
		return this.amountMinor === other.amountMinor && this.currency === other.currency
	}

	// Сериализация в JSON-ответ. Контракт API: { amountMinor: 30000, currency: "RUB" }.
	// Клиент сам форматирует — `${amountMinor / 100} ${currency}`.
	toJSON(): {amountMinor: number; currency: string} {
		return {amountMinor: this.amountMinor, currency: this.currency}
	}
}
