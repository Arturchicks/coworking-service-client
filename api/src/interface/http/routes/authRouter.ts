import {NextFunction, Request, RequestHandler, Response, Router} from 'express'
import {ChangePasswordUseCase} from '../../../application/auth/ChangePasswordUseCase'
import {LoginUseCase} from '../../../application/auth/LoginUseCase'
import {MeUseCase} from '../../../application/auth/MeUseCase'
import {RegisterUseCase} from '../../../application/auth/RegisterUseCase'
import {UpdateProfileUseCase} from '../../../application/auth/UpdateProfileUseCase'
import env from '../../../infrastructure/config/env'
import {SESSION_COOKIE_NAME, UnauthorizedError} from '../../middleware/authMiddleware'


function setSessionCookie(res: Response, token: string) {
	res.cookie(SESSION_COOKIE_NAME, token, {
		httpOnly: true,
		secure: env.cookieSecure,
		sameSite: 'lax',
		path: '/',
		maxAge: env.jwtTtlSeconds * 1000,
	})
}

function clearSessionCookie(res: Response) {
	res.clearCookie(SESSION_COOKIE_NAME, {
		httpOnly: true,
		secure: env.cookieSecure,
		sameSite: 'lax',
		path: '/',
	})
}

export function createAuthRouter(deps: {
	register: RegisterUseCase
	login: LoginUseCase
	me: MeUseCase
	updateProfile: UpdateProfileUseCase
	changePassword: ChangePasswordUseCase
	authRequired: RequestHandler
}): Router {
	const router = Router()

	router.post('/register', async (req: Request, res: Response, next: NextFunction) => {
		try {
			const body = req.body ?? {}
			if (typeof body.email !== 'string' || typeof body.password !== 'string') {
				res.status(400).json({error: 'email and password required (strings)'})
				return
			}
			const result = await deps.register.execute({email: body.email, password: body.password})
			setSessionCookie(res, result.token)
			res.status(201).json({user: result.user})
		} catch (err) { next(err) }
	})

	router.post('/login', async (req: Request, res: Response, next: NextFunction) => {
		try {
			const body = req.body ?? {}
			if (typeof body.email !== 'string' || typeof body.password !== 'string') {
				res.status(400).json({error: 'email and password required (strings)'})
				return
			}
			const result = await deps.login.execute({email: body.email, password: body.password})
			setSessionCookie(res, result.token)
			res.status(200).json({user: result.user})
		} catch (err) { next(err) }
	})

	router.post('/logout', (_req: Request, res: Response) => {
		clearSessionCookie(res)
		res.status(204).end()
	})

	router.get('/me', async (req: Request, res: Response, next: NextFunction) => {
		try {
			if (!req.userId) return next(new UnauthorizedError())
			const user = await deps.me.execute(req.userId)
			if (!user) {
				clearSessionCookie(res)
				return next(new UnauthorizedError())
			}
			res.status(200).json({user})
		} catch (err) { next(err) }
	})

	// PATCH /auth/me — обновить профиль.
	// Семантика PATCH (RFC 5789): частичное обновление. undefined-поле в body
	// означает "не менять", `null` для optional полей означает "очистить".
	router.patch('/me', deps.authRequired, async (req: Request, res: Response, next: NextFunction) => {
		try {
			if (!req.userId) return next(new UnauthorizedError())
			const body = req.body ?? {}
			const accept = (v: unknown): string | null | undefined => {
				if (v === undefined) return undefined
				if (v === null) return null
				if (typeof v === 'string') return v
				throw new Error('User: profile field must be string or null')
			}
			const updated = await deps.updateProfile.execute({
				userId: req.userId,
				email: typeof body.email === 'string' ? body.email : undefined,
				displayName: accept(body.displayName),
				phone: accept(body.phone),
				avatarUrl: accept(body.avatarUrl),
			})
			res.status(200).json({user: updated})
		} catch (err) { next(err) }
	})

	// POST /auth/password — сменить пароль.
	// Тело: {currentPassword, newPassword}. Не возвращает токен — текущая сессия
	// остаётся валидной (текущий JWT не инвалидируется при смене пароля; revoke придёт
	// с refresh-token-store, на MVP — accepted limitation).
	router.post('/password', deps.authRequired, async (req: Request, res: Response, next: NextFunction) => {
		try {
			if (!req.userId) return next(new UnauthorizedError())
			const body = req.body ?? {}
			if (typeof body.currentPassword !== 'string' || typeof body.newPassword !== 'string') {
				res.status(400).json({error: 'currentPassword and newPassword required (strings)'})
				return
			}
			await deps.changePassword.execute({
				userId: req.userId,
				currentPassword: body.currentPassword,
				newPassword: body.newPassword,
			})
			res.status(204).end()
		} catch (err) { next(err) }
	})

	return router
}
