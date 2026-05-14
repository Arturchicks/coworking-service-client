import {NextFunction, Request, RequestHandler, Response, Router} from 'express'
import {ListMySubscriptionsUseCase} from '../../../application/subscriptions/ListMySubscriptionsUseCase'
import {UnauthorizedError} from '../../middleware/authMiddleware'


export function createSubscriptionsRouter(deps: {
	listMine: ListMySubscriptionsUseCase
	authRequired: RequestHandler
}): Router {
	const router = Router()
	router.use(deps.authRequired)

	router.get('/mine', async (req: Request, res: Response, next: NextFunction) => {
		try {
			if (!req.userId) return next(new UnauthorizedError())
			const dto = await deps.listMine.execute(req.userId)
			res.status(200).json(dto)
		} catch (err) {
			next(err)
		}
	})

	return router
}
