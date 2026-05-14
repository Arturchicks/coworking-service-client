// Конфигурационный модуль — единственное место, где читается process.env.
// Принципы: Single Source of Truth, Anti-Corruption Layer, Dependency Inversion.
//
// FLAG (правило #3 — нарушение, флажу не чиню): нет Fail-Fast валидации zod/envalid.
// Защита от пустого JWT_SECRET перенесена в JoseJwtTokenIssuer (бросает при < 32 chars).
// Это distributed validation — лучше централизовать здесь, как станет 5+ переменных.
export type Env = {
	readonly port: number
	readonly nodeEnv: string
	readonly databaseUrl: string
	readonly jwtSecret: string
	readonly jwtTtlSeconds: number
	readonly cookieSecure: boolean
}

const env: Env = {
	port: Number(process.env.PORT) || 3001,
	nodeEnv: process.env.NODE_ENV ?? 'development',
	databaseUrl: process.env.DATABASE_URL ?? '',
	// Дефолт-секрет ТОЛЬКО для dev. В .env прода — обязательно свой, ≥32 chars.
	// JoseJwtTokenIssuer бросает, если короткий → процесс не стартует с небезопасным конфигом.
	jwtSecret: process.env.JWT_SECRET ?? 'dev-only-secret-please-change-in-production-32+chars',
	// 7 дней — компромисс между UX (не разлогинивает каждый день) и безопасностью.
	// При полноценном refresh-flow access будет короче (~15 мин), но это следующий этап.
	jwtTtlSeconds: Number(process.env.JWT_TTL_SECONDS) || 60 * 60 * 24 * 7,
	// httpOnly + secure cookies — в prod (https). В dev secure=false, иначе браузер не сохранит.
	cookieSecure: (process.env.NODE_ENV ?? 'development') === 'production',
}

export default env
