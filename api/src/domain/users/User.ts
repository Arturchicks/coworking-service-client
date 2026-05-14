// User Aggregate Root.
// DDD: identity-based объект, encapsulates state mutation.
// Profile-поля (displayName, phone, avatarUrl) — optional с nullable семантикой.
// `null` = "не задано", не "пустая строка" — это разные состояния (Information Hiding).

export interface UserProfile {
	displayName: string | null
	phone: string | null
	avatarUrl: string | null
}

export class User {
	private constructor(
		public readonly id: string,
		public email: string,
		public passwordHash: string,
		public displayName: string | null,
		public phone: string | null,
		public avatarUrl: string | null,
		public readonly createdAt: Date,
	) {}

	static create(props: {
		id: string
		email: string
		passwordHash: string
		displayName?: string | null
		phone?: string | null
		avatarUrl?: string | null
		createdAt?: Date
	}): User {
		if (!props.id) throw new Error('User: id required')
		if (!User.isValidEmail(props.email)) throw new Error('User: email invalid')
		if (!props.passwordHash) throw new Error('User: passwordHash required')
		return new User(
			props.id,
			props.email.trim().toLowerCase(),
			props.passwordHash,
			props.displayName ?? null,
			props.phone ?? null,
			props.avatarUrl ?? null,
			props.createdAt ?? new Date(),
		)
	}

	static reconstitute(props: {
		id: string
		email: string
		passwordHash: string
		displayName: string | null
		phone: string | null
		avatarUrl: string | null
		createdAt: Date
	}): User {
		return new User(
			props.id,
			props.email,
			props.passwordHash,
			props.displayName,
			props.phone,
			props.avatarUrl,
			props.createdAt,
		)
	}

	// updateProfile: Tell-Don't-Ask. Use case передаёт patch — Entity сама валидирует
	// и применяет. undefined-поле = "не менять", null = "очистить".
	// Это разные семантики (PATCH vs PUT в HTTP-смысле).
	updateProfile(patch: {
		email?: string
		displayName?: string | null
		phone?: string | null
		avatarUrl?: string | null
	}): void {
		if (patch.email !== undefined) {
			if (!User.isValidEmail(patch.email)) throw new Error('User: email invalid')
			this.email = patch.email.trim().toLowerCase()
		}
		if (patch.displayName !== undefined) {
			this.displayName = normalizeOptional(patch.displayName)
		}
		if (patch.phone !== undefined) {
			this.phone = normalizeOptional(patch.phone)
		}
		if (patch.avatarUrl !== undefined) {
			const value = normalizeOptional(patch.avatarUrl)
			if (value !== null && !User.isValidUrl(value)) {
				throw new Error('User: avatarUrl must be a valid http(s) URL')
			}
			this.avatarUrl = value
		}
	}

	// changePasswordHash принимает УЖЕ-захешированный пароль.
	// Хеширование делает PasswordHasher в use case — domain не знает про bcrypt
	// (Dependency Inversion / DDD rule #6).
	changePasswordHash(newHash: string): void {
		if (!newHash) throw new Error('User: passwordHash required')
		this.passwordHash = newHash
	}

	// Safe-projection — не включает passwordHash, расширена profile-полями.
	toPublic(): {id: string; email: string; createdAt: string} & UserProfile {
		return {
			id: this.id,
			email: this.email,
			displayName: this.displayName,
			phone: this.phone,
			avatarUrl: this.avatarUrl,
			createdAt: this.createdAt.toISOString(),
		}
	}

	private static isValidEmail(email: string): boolean {
		return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())
	}

	// Минимальная проверка URL — http(s) схема. URL constructor бросает на невалидном.
	// FLAG: не проверяет, что URL ведёт на реальный image — это сделает <img onError> на фронте.
	private static isValidUrl(url: string): boolean {
		try {
			const u = new URL(url)
			return u.protocol === 'http:' || u.protocol === 'https:'
		} catch {
			return false
		}
	}
}

// Helper: пустая строка → null. "Не задано" семантически = null, не "".
// Это упрощает БД-запросы (IS NULL вместо OR = '') и фронт-условия (!user.phone).
function normalizeOptional(value: string | null): string | null {
	if (value === null) return null
	const trimmed = value.trim()
	return trimmed === '' ? null : trimmed
}
