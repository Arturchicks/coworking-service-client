import {User} from './User'


// Доменные ошибки auth. Anti-Corruption Layer на границе репозитория:
// "уникальность email" — это invariant на уровне БД (UNIQUE constraint),
// но use case ловит доменную ошибку, не "DatabaseError 23505".
export class UserEmailTakenError extends Error {
	constructor(email: string) {
		super(`User email already registered: ${email}`)
		this.name = 'UserEmailTakenError'
	}
}

export interface UserRepository {
	// save() = INSERT для нового. На MVP UPDATE'а нет — пока нет фич "сменить email/пароль".
	// Если будут — добавим отдельный метод update() или сделаем save() upsert через ON CONFLICT.
	save(user: User): Promise<void>
	findByEmail(email: string): Promise<User | null>
	findById(id: string): Promise<User | null>
}
