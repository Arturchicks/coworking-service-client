import {DatabaseError, Pool} from 'pg'
import {User} from '../../domain/users/User'
import {UserEmailTakenError, UserRepository} from '../../domain/users/UserRepository'


// 23505 — unique_violation. Источник: errcodes appendix в доке Postgres.
const PG_UNIQUE_VIOLATION = '23505'

export class PgUserRepository implements UserRepository {
	constructor(private readonly pool: Pool) {}

	// save = upsert: INSERT для нового, UPDATE при изменении профиля/пароля.
	// ON CONFLICT (id) DO UPDATE — обновляет mutable поля.
	// email тоже в UPDATE — потому что юзер может его менять (см. UpdateProfileUseCase).
	// При коллизии email бросаем доменную UserEmailTakenError (Anti-Corruption Layer).
	async save(user: User): Promise<void> {
		try {
			await this.pool.query(
				`INSERT INTO users (id, email, password_hash, display_name, phone, avatar_url, created_at)
				 VALUES ($1, $2, $3, $4, $5, $6, $7)
				 ON CONFLICT (id) DO UPDATE
				 SET email         = EXCLUDED.email,
				     password_hash = EXCLUDED.password_hash,
				     display_name  = EXCLUDED.display_name,
				     phone         = EXCLUDED.phone,
				     avatar_url    = EXCLUDED.avatar_url`,
				[
					user.id,
					user.email,
					user.passwordHash,
					user.displayName,
					user.phone,
					user.avatarUrl,
					user.createdAt.toISOString(),
				],
			)
		} catch (err) {
			if (err instanceof DatabaseError && err.code === PG_UNIQUE_VIOLATION) {
				throw new UserEmailTakenError(user.email)
			}
			throw err
		}
	}

	async findByEmail(email: string): Promise<User | null> {
		const {rows} = await this.pool.query(SELECT_USER + ` WHERE email = $1`, [email])
		if (rows.length === 0) return null
		return rowToUser(rows[0])
	}

	async findById(id: string): Promise<User | null> {
		const {rows} = await this.pool.query(SELECT_USER + ` WHERE id = $1`, [id])
		if (rows.length === 0) return null
		return rowToUser(rows[0])
	}
}

const SELECT_USER = `SELECT id, email, password_hash, display_name, phone, avatar_url, created_at FROM users`

function rowToUser(row: Record<string, unknown>): User {
	return User.reconstitute({
		id: String(row.id),
		email: String(row.email),
		passwordHash: String(row.password_hash),
		displayName: row.display_name == null ? null : String(row.display_name),
		phone: row.phone == null ? null : String(row.phone),
		avatarUrl: row.avatar_url == null ? null : String(row.avatar_url),
		createdAt: row.created_at instanceof Date ? row.created_at : new Date(String(row.created_at)),
	})
}
