import {NextFunction, Request, RequestHandler, Response, Router} from 'express'
import {CancelBookingUseCase} from '../../../application/bookings/CancelBookingUseCase'
import {CreateBookingUseCase} from '../../../application/bookings/CreateBookingUseCase'
import {ListMyBookingsUseCase} from '../../../application/bookings/ListMyBookingsUseCase'
import {UnauthorizedError} from '../../middleware/authMiddleware'


// Thin router. Все эндпоинты требуют auth — auth middleware регистрируется ВНЕ роутера
// (см. server.ts), здесь только использование req.userId.
export function createBookingsRouter(deps: {
	createBooking: CreateBookingUseCase
	listMyBookings: ListMyBookingsUseCase
	cancelBooking: CancelBookingUseCase
	authRequired: RequestHandler
}): Router {
	const router = Router()

	// Применяем auth-middleware ко всем routes этого роутера.
	router.use(deps.authRequired)

	router.post('/', async (req: Request, res: Response, next: NextFunction) => {
		try {
			if (!req.userId) return next(new UnauthorizedError())
			const body = req.body ?? {}
			if (typeof body.workspaceId !== 'string'
				|| typeof body.startsAt !== 'string'
				|| typeof body.endsAt !== 'string') {
				res.status(400).json({error: 'workspaceId, startsAt, endsAt required (strings)'})
				return
			}
			const dto = await deps.createBooking.execute({
				workspaceId: body.workspaceId,
				userId: req.userId,
				startsAt: body.startsAt,
				endsAt: body.endsAt,
			})
			res.status(201).json(dto)
		} catch (err) {
			next(err)
		}
	})

	// GET /bookings/mine — больше не нужен email-параметр; userId из токена.
	router.get('/mine', async (req: Request, res: Response, next: NextFunction) => {
		try {
			if (!req.userId) return next(new UnauthorizedError())
			const dto = await deps.listMyBookings.execute(req.userId)
			res.status(200).json(dto)
		} catch (err) {
			next(err)
		}
	})

	router.post('/:id/cancel', async (req: Request, res: Response, next: NextFunction) => {
		try {
			if (!req.userId) return next(new UnauthorizedError())
			const bookingId = String(req.params.id ?? '')
			const dto = await deps.cancelBooking.execute({bookingId, userId: req.userId})
			res.status(200).json(dto)
		} catch (err) {
			next(err)
		}
	})

	return router
}
