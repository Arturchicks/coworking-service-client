import env from '../../infrastructure/config/env'
// Side-effect import (без bindings): pool.ts регистрирует pool.on('error', ...) handler
// на старте процесса. Без него ошибки на idle-соединениях падают в unhandledError и убивают
// процесс. Сам Pool ленив — TCP-соединения откроются только при первой pool.query().
import '../../infrastructure/db/pool'
import {createServer} from './server'


// Composition Root — точка входа процесса. Здесь сборка: env, server, listen, shutdown-хуки.
// Принцип: вся "грязная" работа (IO, side effects) — в одном месте, ближе к main.
// Чистые модули (domain, application) не знают про process.env / listen.
const app = createServer()

const server = app.listen(env.port, () => {
	// JSON-логи — стандарт для агрегаторов (Loki, ELK): структурированный поиск/фильтрация.
	// На MVP это console.log; в реальном проекте — pino/winston с уровнями.
	console.log(JSON.stringify({
		level: 'info',
		msg: 'API started',
		port: env.port,
		ts: new Date().toISOString(),
	}))
})

// Graceful Shutdown — фундаментальная концепция для production-сервисов.
// Когда orchestrator (Docker, k8s) шлёт SIGTERM, сервис должен:
//   1. Перестать принимать новые соединения (server.close).
//   2. Дождаться завершения in-flight запросов.
//   3. Закрыть пулы (БД), сбросить буферы логов.
//   4. process.exit(0).
// Без этого SIGTERM → grace period (10s в Docker) → SIGKILL → обрыв на середине запроса.
//
// FLAG: текущая реализация не закрывает pg.Pool и не имеет таймаута на server.close
// — если есть зависший keep-alive, shutdown повиснет. На MVP приемлемо; правит в проде.
function shutdown(signal: string) {
	console.log(JSON.stringify({level: 'info', msg: `received ${signal}, shutting down`, ts: new Date().toISOString()}))
	server.close(() => process.exit(0))
}

// SIGTERM — "остановись цивилизованно" (docker stop / kill <PID>).
// SIGINT — Ctrl+C в интерактивном терминале.
// SIGKILL/SIGSTOP перехватить нельзя — это by design ОС.
process.on('SIGTERM', () => shutdown('SIGTERM'))
process.on('SIGINT', () => shutdown('SIGINT'))
