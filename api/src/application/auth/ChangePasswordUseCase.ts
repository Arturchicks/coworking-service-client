import {PasswordHasher} from '../../domain/users/PasswordHasher'
import {UserRepository} from '../../domain/users/UserRepository'
import {InvalidCredentialsError} from './LoginUseCase'
import {InvalidPasswordError} from './RegisterUseCase'
import {UserNotFoundError} from './UpdateProfileUseCase'


export interface ChangePasswordInput {
	userId: string
	currentPassword: string
	newPassword: string
}

// Use case "сменить пароль".
// Шаги:
//   1. Валидация длины нового пароля (≥8) — Fail-Fast.
//   2. Найти юзера, проверить currentPassword через hasher.verify.
//   3. Если не подошёл — InvalidCredentialsError (401, generic — не раскрываем "current vs new").
//   4. Хешируем новый пароль, user.changePasswordHash, save.
//
// CS-принцип: requireCurrentPassword = "knowledge factor" — даже при перехваченной
// сессии злоумышленник не может сменить пароль не зная старого.
// Источник: OWASP Authentication Cheat Sheet — "Password Change".
export class ChangePasswordUseCase {
	constructor(
		private readonly users: UserRepository,
		private readonly hasher: PasswordHasher,
	) {}

	async execute(input: ChangePasswordInput): Promise<void> {
		if (typeof input.newPassword !== 'string' || input.newPassword.length < 8) {
			throw new InvalidPasswordError('must be at least 8 characters')
		}

		const user = await this.users.findById(input.userId)
		if (!user) throw new UserNotFoundError(input.userId)

		const ok = await this.hasher.verify(input.currentPassword, user.passwordHash)
		if (!ok) throw new InvalidCredentialsError()

		const newHash = await this.hasher.hash(input.newPassword)
		user.changePasswordHash(newHash)
		await this.users.save(user)
	}
}
