import {Request, Response, NextFunction} from 'express'
import {InvalidCredentialsError} from '../../application/auth/LoginUseCase'
import {InvalidPasswordError} from '../../application/auth/RegisterUseCase'
import {UserNotFoundError} from '../../application/auth/UpdateProfileUseCase'
import {BookingForbiddenError} from '../../application/bookings/CancelBookingUseCase'
import {SubscriptionRequiredError, WorkspaceNotFoundError} from '../../application/bookings/CreateBookingUseCase'
import {PaymentFailedError} from '../../application/subscriptions/PurchasePlanUseCase'
import {BookingNotFoundError, BookingOverlapError} from '../../domain/bookings/BookingRepository'
import {PlanNotFoundError} from '../../domain/plans/PlanRepository'
import {UserEmailTakenError} from '../../domain/users/UserRepository'
import {UnauthorizedError} from './authMiddleware'


// Error-middleware. Анти-Corruption Layer на выходе: доменные ошибки → HTTP-коды.
export function errorHandler(err: unknown, _req: Request, res: Response, _next: NextFunction) {
	if (err instanceof UnauthorizedError) return res.status(401).json({error: 'Unauthorized'}) as unknown as void
	if (err instanceof InvalidCredentialsError) return res.status(401).json({error: err.message}) as unknown as void

	// 402 Payment Required — для "иди купи план" (booking без подписки) и "платёж не прошёл".
	// RFC 7231 semantic — purchase required to access the resource.
	if (err instanceof SubscriptionRequiredError) return res.status(402).json({error: err.message}) as unknown as void
	if (err instanceof PaymentFailedError) return res.status(402).json({error: err.message}) as unknown as void

	if (err instanceof BookingOverlapError || err instanceof UserEmailTakenError) {
		return res.status(409).json({error: err.message}) as unknown as void
	}
	if (err instanceof BookingNotFoundError || err instanceof WorkspaceNotFoundError || err instanceof PlanNotFoundError || err instanceof UserNotFoundError) {
		return res.status(404).json({error: err.message}) as unknown as void
	}
	if (err instanceof BookingForbiddenError) return res.status(403).json({error: err.message}) as unknown as void
	if (err instanceof InvalidPasswordError) return res.status(400).json({error: err.message}) as unknown as void

	// 400 — доменные ошибки валидации VO/entity по prefix.
	if (err instanceof Error && /^(TimeRange|Workspace|Booking|Money|User|Plan|Subscription|Payment):/.test(err.message)) {
		return res.status(400).json({error: err.message}) as unknown as void
	}

	const message = err instanceof Error ? err.message : String(err)
	const stack = err instanceof Error ? err.stack : undefined
	console.error(JSON.stringify({level: 'error', msg: message, stack, ts: new Date().toISOString()}))
	res.status(500).json({error: 'Internal server error'})
}
