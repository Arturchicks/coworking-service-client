import {Router, Request, Response, NextFunction} from 'express'
import {CheckAvailabilityUseCase} from '../../../application/workspaces/CheckAvailabilityUseCase'
import {ListWorkspacesUseCase} from '../../../application/workspaces/ListWorkspacesUseCase'


// Thin router: parse query → call use case → serialize. NO business logic.
export function createWorkspacesRouter(deps: {
	listWorkspaces: ListWorkspacesUseCase
	checkAvailability: CheckAvailabilityUseCase
}): Router {
	const router = Router()

	router.get('/', async (_req: Request, res: Response, next: NextFunction) => {
		try {
			const dto = await deps.listWorkspaces.execute()
			res.status(200).json(dto)
		} catch (err) {
			// КРИТИЧНО для Express 5: async-ошибки автоматически НЕ доходят до errorHandler.
			// Источник: https://expressjs.com/en/guide/error-handling.html#catching-errors
			// В Express 5 это улучшено, но привычка передавать через next(err) — самая надёжная.
			next(err)
		}
	})

	router.get('/available', async (req: Request, res: Response, next: NextFunction) => {
		try {
			const startsAt = String(req.query.startsAt ?? '')
			const endsAt = String(req.query.endsAt ?? '')
			if (!startsAt || !endsAt) {
				res.status(400).json({error: 'startsAt and endsAt query parameters are required (ISO 8601)'})
				return
			}
			const dto = await deps.checkAvailability.execute({startsAt, endsAt})
			res.status(200).json(dto)
		} catch (err) {
			next(err)
		}
	})

	return router
}
