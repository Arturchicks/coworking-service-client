import {NextFunction, Request, RequestHandler, Response, Router} from 'express'
import {ListPlansUseCase} from '../../../application/plans/ListPlansUseCase'
import {PurchasePlanUseCase} from '../../../application/subscriptions/PurchasePlanUseCase'
import {UnauthorizedError} from '../../middleware/authMiddleware'


export function createPlansRouter(deps: {
	listPlans: ListPlansUseCase
	purchasePlan: PurchasePlanUseCase
	authRequired: RequestHandler
}): Router {
	const router = Router()

	// GET /plans — публичный endpoint (любой может посмотреть каталог).
	router.get('/', async (_req: Request, res: Response, next: NextFunction) => {
		try {
			const dto = await deps.listPlans.execute()
			res.status(200).json(dto)
		} catch (err) {
			next(err)
		}
	})

	// POST /plans/:id/purchase — требует auth (purchase для текущего юзера).
	router.post('/:id/purchase', deps.authRequired, async (req: Request, res: Response, next: NextFunction) => {
		try {
			if (!req.userId) return next(new UnauthorizedError())
			const planId = String(req.params.id ?? '')
			const dto = await deps.purchasePlan.execute({planId, userId: req.userId})
			res.status(201).json(dto)
		} catch (err) {
			next(err)
		}
	})

	return router
}
