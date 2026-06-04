// Загрузка .env ДО любого чтения process.env. dotenv мутирует process.env in-place
// и тихо игнорирует отсутствующий файл (в Docker .env приходит через docker-compose
// env_file: и dotenv ничего не находит — это ОК).
//
// Путь: .env лежит в корне монорепо, а `pnpm --filter @mvp/api dev` запускает процесс
// с cwd=api/, поэтому дефолтный `dotenv/config` (ищет в cwd) не находит файл. Резолвим
// относительно ЭТОГО файла — работает откуда бы ни был запущен процесс.
// override:false — реальные переменные процесса (docker-compose env_file, shell export)
// приоритетнее значений из .env.
//
// Принцип: explicit dependency — модулю env.ts нужны env-vars, и он сам их же подгружает.
import {config as loadDotenv} from 'dotenv'
import {resolve} from 'node:path'


loadDotenv({path: resolve(__dirname, '../../../../.env'), override: false})


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
