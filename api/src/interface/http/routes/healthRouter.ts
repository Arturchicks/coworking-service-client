import {Router, Request, Response} from 'express'
import {GetLivenessUseCase} from '../../../application/healthcheck/GetLivenessUseCase'


// Factory-функция роутера — зависимости через параметр (DI), а не singleton-импорт.
// CLAUDE.md DDD: "interface/http: thin routers — parse → call use case → serialize. No business logic."
export function createHealthRouter(deps: {getLiveness: GetLivenessUseCase}): Router {
	// Router() — изолированный mini-app Express'а. Монтируется в основное приложение через app.use().
	const router = Router()

	// `_req` с подчёркиванием — TS-конвенция "параметр объявлен, но не нужен".
	// ESLint игнорирует _-префиксированные unused-vars (см. eslint.config.ts).
	router.get('/health', (_req: Request, res: Response) => {
		// Liveness синхронный, без БД — поэтому без async/try-catch. Исключения из чистой синхронной
		// логики Express подхватит штатно и направит в errorHandler.
		res.status(200).json(deps.getLiveness.execute())
	})

	return router
}
