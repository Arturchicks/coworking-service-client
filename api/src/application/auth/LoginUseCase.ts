import {TokenIssuer} from '../../domain/auth/TokenIssuer'
import {PasswordHasher} from '../../domain/users/PasswordHasher'
import {UserRepository} from '../../domain/users/UserRepository'
import type {AuthResult} from './RegisterUseCase'


// Доменная ошибка "invalid credentials". Маппится в 401.
// Важно: единая ошибка и для "email не существует", и для "пароль не подошёл".
// CS-принцип / security: не раскрываем существование email (защита от user enumeration).
// Источник: OWASP Authentication Cheat Sheet — Generic Error Messages.
export class InvalidCredentialsError extends Error {
	constructor() {
		super('Invalid email or password')
		this.name = 'InvalidCredentialsError'
	}
}

export interface LoginInput {
	email: string
	password: string
}

export class LoginUseCase {
	constructor(
		private readonly users: UserRepository,
		private readonly hasher: PasswordHasher,
		private readonly tokens: TokenIssuer,
	) {}

	async execute(input: LoginInput): Promise<AuthResult> {
		const user = await this.users.findByEmail(input.email.trim().toLowerCase())
		// Ветка-no-user: если юзера нет — всё равно делаем dummy hash-verify,
		// чтобы время ответа не выдавало "юзер не существует" vs "пароль неверный"
		// (timing attack). На MVP упрощу: просто бросаем после короткого await Promise.resolve().
		// Полноценная защита — отдельная задача.
		if (!user) {
			// Минимальная защита timing: ровно одна await-операция, как при успешном login.
			await this.hasher.verify(input.password, '$2a$10$invalidhashinvalidhashinvalidha')
			throw new InvalidCredentialsError()
		}

		const ok = await this.hasher.verify(input.password, user.passwordHash)
		if (!ok) throw new InvalidCredentialsError()

		const token = await this.tokens.issue(user.id)
		return {user: user.toPublic(), token}
	}
}
