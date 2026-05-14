import {UserRepository} from '../../domain/users/UserRepository'


export class UserNotFoundError extends Error {
	constructor(id: string) {
		super(`User not found: ${id}`)
		this.name = 'UserNotFoundError'
	}
}

// `undefined` = не менять; `null` (для optional полей) = очистить.
// `email` — `undefined` или string (нельзя установить email = null, это required).
export interface UpdateProfileInput {
	userId: string
	email?: string
	displayName?: string | null
	phone?: string | null
	avatarUrl?: string | null
}

// Use case "обновить профиль".
// Шаги:
//   1. Найти пользователя (UserNotFoundError если нет — обычно не должно случаться,
//      т.к. userId приходит из JWT, но Defense in Depth).
//   2. Если меняется email — проверить, что он не занят другим юзером.
//   3. user.updateProfile(patch) — entity сама валидирует и применяет.
//   4. save → БД вернёт unique-violation, если race-condition'ом email уже занят
//      (UserEmailTakenError, Anti-Corruption Layer в repo).
export class UpdateProfileUseCase {
	constructor(private readonly users: UserRepository) {}

	async execute(input: UpdateProfileInput) {
		const user = await this.users.findById(input.userId)
		if (!user) throw new UserNotFoundError(input.userId)

		// Pre-check email uniqueness: даём более чистую ошибку при обычной коллизии.
		// БД-constraint всё равно остановит race-condition после save.
		if (input.email && input.email.trim().toLowerCase() !== user.email) {
			const existing = await this.users.findByEmail(input.email.trim().toLowerCase())
			if (existing) {
				const {UserEmailTakenError} = await import('../../domain/users/UserRepository')
				throw new UserEmailTakenError(input.email)
			}
		}

		user.updateProfile({
			email: input.email,
			displayName: input.displayName,
			phone: input.phone,
			avatarUrl: input.avatarUrl,
		})
		await this.users.save(user)
		return user.toPublic()
	}
}
