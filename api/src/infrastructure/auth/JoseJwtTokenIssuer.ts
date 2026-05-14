import {jwtVerify, SignJWT} from 'jose'
import {TokenIssuer} from '../../domain/auth/TokenIssuer'


// Адаптер для порта TokenIssuer на базе библиотеки `jose` (JS implementation of JOSE/JWT).
// Почему jose, а не jsonwebtoken: jose поддерживает ESM/Web Crypto, активно мейнтейнится,
// и API под async по умолчанию. jsonwebtoken — legacy callback-style, sync verify.
//
// HS256 = HMAC-SHA256, симметричный алгоритм. Один секрет шифрует и проверяет.
// Альтернатива RS256/ES256 — асимметричная пара ключей. Имеет смысл когда верификация
// нужна в другом сервисе/языке (issuer один, verifier многие). На MVP HS256 — стандартно.
export class JoseJwtTokenIssuer implements TokenIssuer {
	private readonly secretBytes: Uint8Array
	private readonly ttlSeconds: number

	constructor(secret: string, ttlSeconds: number) {
		if (!secret || secret.length < 32) {
			// Fail-Fast на старте: пустой/короткий секрет = взлом за минуты.
			// CS-принцип: Defense in Depth — не позволяем системе подняться в небезопасной конфигурации.
			throw new Error('JoseJwtTokenIssuer: secret must be at least 32 chars')
		}
		// jose работает с Uint8Array. Кодируем UTF-8.
		this.secretBytes = new TextEncoder().encode(secret)
		this.ttlSeconds = ttlSeconds
	}

	async issue(userId: string): Promise<string> {
		const now = Math.floor(Date.now() / 1000)
		return new SignJWT({sub: userId})
			.setProtectedHeader({alg: 'HS256'})
			.setIssuedAt(now)
			.setExpirationTime(now + this.ttlSeconds)
			.sign(this.secretBytes)
	}

	async verify(token: string): Promise<{userId: string} | null> {
		try {
			const {payload} = await jwtVerify(token, this.secretBytes)
			// `sub` — стандартное JWT-поле "subject" (RFC 7519). Здесь — user.id.
			if (typeof payload.sub !== 'string') return null
			return {userId: payload.sub}
		} catch {
			// jwtVerify бросает на expired/invalid signature/malformed. Возвращаем null —
			// middleware превратит в 401 без раскрытия причины (security: not leaking detail).
			return null
		}
	}
}
