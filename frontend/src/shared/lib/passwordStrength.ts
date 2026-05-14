// Чистая функция оценки силы пароля.
// CS-принципы: Pure / Referential Transparency — нет I/O, нет глобального state.
// Один и тот же input → один и тот же output → можно мемоизировать / тестировать тривиально.
//
// FLAG: это эвристический score, не cryptographic estimate. Для production-уровня
// используйте zxcvbn (учитывает словари, частые шаблоны, keyboard runs). На MVP
// 4-критерийная схема (длина + типы символов) даёт разумную обратную связь юзеру.

export type StrengthLevel = 'too-short' | 'weak' | 'fair' | 'strong' | 'very-strong'

export interface Criterion {
	met: boolean
	text: string
}

export interface StrengthResult {
	level: StrengthLevel
	// score 0..4 — удобно для прогресс-бара (mapping на ширину/цвет сегментов).
	score: 0 | 1 | 2 | 3 | 4
	label: string
	criteria: Criterion[]
}

// Конфиг критериев — централизованно, не размазано по коду.
const MIN_LENGTH = 8
const STRONG_LENGTH = 16

export function evaluatePassword(password: string): StrengthResult {
	const len = password.length
	const hasLower = /[a-z]/.test(password)
	const hasUpper = /[A-Z]/.test(password)
	const hasDigit = /\d/.test(password)
	const hasSpecial = /[^A-Za-z0-9]/.test(password)
	const typesCount = [hasLower, hasUpper, hasDigit, hasSpecial].filter(Boolean).length

	const criteria: Criterion[] = [
		{met: len >= MIN_LENGTH, text: `Минимум ${MIN_LENGTH} символов`},
		{met: hasLower && hasUpper, text: 'Заглавные и строчные буквы'},
		{met: hasDigit, text: 'Хотя бы одна цифра'},
		{met: hasSpecial, text: 'Спец-символ (!@#$ и т.п.)'},
	]

	// Пустое поле — отдельное состояние, чтобы не мигать "слишком коротким" с первого символа.
	if (len === 0) {
		return {level: 'too-short', score: 0, label: '', criteria}
	}
	if (len < MIN_LENGTH) {
		return {level: 'too-short', score: 0, label: 'Слишком короткий', criteria}
	}
	if (typesCount === 1) {
		return {level: 'weak', score: 1, label: 'Лёгкий', criteria}
	}
	if (typesCount === 2) {
		return {level: 'fair', score: 2, label: 'Средний', criteria}
	}
	// 3 типа ИЛИ 4 типа без длины — сильный.
	if (typesCount === 3 || (typesCount === 4 && len < STRONG_LENGTH)) {
		return {level: 'strong', score: 3, label: 'Сложный', criteria}
	}
	// 4 типа + длина ≥ 16 — максимум.
	return {level: 'very-strong', score: 4, label: 'Очень сложный', criteria}
}

// Хелпер для UI — проходной балл (≥ MIN_LENGTH).
// Если пароль слишком короткий — это валидационная ошибка, форма submit не должна работать.
export function isPasswordAcceptable(password: string): boolean {
	return password.length >= MIN_LENGTH
}
