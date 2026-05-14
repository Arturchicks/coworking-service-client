import {NextFunction, Request, Response} from 'express'
import {TokenIssuer} from '../../domain/auth/TokenIssuer'


// Доменная ошибка "не авторизован". errorHandler маппит в 401.
export class UnauthorizedError extends Error {
	constructor() {
		super('Unauthorized')
		this.name = 'UnauthorizedError'
	}
}

// Расширяем Request типом — после middleware у req появляется userId.
// Augmentation через global namespace Express — @types/express объявляет интерфейс
// Request именно в этом namespace. Прямое `declare module 'express'` не работает,
// потому что Request там — реэкспорт из express-serve-static-core.
//
// Это стандартный TS-приём для express middleware. Альтернатива (cleaner) —
// AsyncLocalStorage / контекст, но на MVP мутация req приемлема.
declare global {
	// eslint-disable-next-line @typescript-eslint/no-namespace
	namespace Express {
		interface Request {
			userId?: string
		}
	}
}

const COOKIE_NAME = 'session'

// Парсит токен из cookie `session` или из Authorization: Bearer ...
// Cookie приоритетнее — для веб-фронта это основной канал.
// Bearer — для curl/Postman/тестов.
function extractToken(req: Request): string | null {
	const cookieToken = (req.cookies as Record<string, string> | undefined)?.[COOKIE_NAME]
	if (cookieToken) return cookieToken
	const auth = req.header('authorization')
	if (auth?.startsWith('Bearer ')) return auth.slice(7).trim()
	return null
}

// Factory для middleware. Зависимость (TokenIssuer) инжектится из Composition Root.
// CS-принцип: middleware — не singleton, factory принимает deps и возвращает функцию.
export function createAuthMiddleware(tokens: TokenIssuer) {
	return async function authMiddleware(req: Request, _res: Response, next: NextFunction) {
		const token = extractToken(req)
		if (!token) {
			next(new UnauthorizedError())
			return
		}
		const result = await tokens.verify(token)
		if (!result) {
			next(new UnauthorizedError())
			return
		}
		req.userId = result.userId
		next()
	}
}

// Опциональный — не бросает, если токен отсутствует. Просто проставляет req.userId если есть.
// Полезно для эндпоинтов, у которых поведение зависит от логин-статуса (например, /workspaces
// может возвращать price_user-specific, если есть subscription).
export function createOptionalAuthMiddleware(tokens: TokenIssuer) {
	return async function optionalAuthMiddleware(req: Request, _res: Response, next: NextFunction) {
		const token = extractToken(req)
		if (!token) {
			next()
			return
		}
		const result = await tokens.verify(token)
		if (result) req.userId = result.userId
		next()
	}
}

export const SESSION_COOKIE_NAME = COOKIE_NAME
