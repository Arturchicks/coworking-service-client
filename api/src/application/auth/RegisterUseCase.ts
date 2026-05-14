import {randomUUID} from 'node:crypto'
import {TokenIssuer} from '../../domain/auth/TokenIssuer'
import {PasswordHasher} from '../../domain/users/PasswordHasher'
import {User} from '../../domain/users/User'
import {UserEmailTakenError, UserRepository} from '../../domain/users/UserRepository'


export class InvalidPasswordError extends Error {
	constructor(reason: string) {
		super(`Invalid password: ${reason}`)
		this.name = 'InvalidPasswordError'
	}
}

export interface RegisterInput {
	email: string
	password: string
}

export interface AuthResult {
	user: {id: string; email: string; createdAt: string}
	token: string
}

// Use case "регистрация". Шаги:
//   1. Валидация пароля (длина) — Fail-Fast.
//   2. Проверка уникальности email через repo.findByEmail.
//   3. bcrypt-hash через PasswordHasher port.
//   4. Сохранение в репозиторий (БД ещё раз проверит UNIQUE — Defense in Depth).
//   5. Выпуск токена для немедленного логина (UX: не заставлять заново вводить пароль).
//
// FLAG (race-condition между шагом 2 и 4): теоретически два параллельных register
// с одинаковым email пройдут шаг 2 одновременно, оба попытаются save. Один поймает
// UserEmailTakenError из БД (UNIQUE constraint). Это OK — invariant в БД спасает.
export class RegisterUseCase {
	constructor(
		private readonly users: UserRepository,
		private readonly hasher: PasswordHasher,
		private readonly tokens: TokenIssuer,
	) {}

	async execute(input: RegisterInput): Promise<AuthResult> {
		if (typeof input.password !== 'string' || input.password.length < 8) {
			throw new InvalidPasswordError('must be at least 8 characters')
		}

		const existing = await this.users.findByEmail(input.email.trim().toLowerCase())
		if (existing) throw new UserEmailTakenError(input.email)

		const passwordHash = await this.hasher.hash(input.password)
		const user = User.create({id: randomUUID(), email: input.email, passwordHash})

		await this.users.save(user)
		const token = await this.tokens.issue(user.id)

		return {user: user.toPublic(), token}
	}
}
