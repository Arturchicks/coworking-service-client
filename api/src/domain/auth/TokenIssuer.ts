// Port для выпуска и верификации session-токенов.
// CS-принцип: domain не должен знать, что внутри JWT (HS256, exp, jti...).
// Адаптер (JoseJwtTokenIssuer в infrastructure) скрывает реализацию.
//
// Контракт минимальный: issue(userId) → opaque-string, verify(string) → userId | null.
// "Opaque" — снаружи токен это просто строка, его внутреннее устройство — деталь реализации.
//
// FLAG: на MVP один тип токена. Полноценный auth требует пару access+refresh
// (access короткоживущий ~15min, refresh ~7d, refresh ротируется). Это следующая итерация.
export interface TokenIssuer {
	issue(userId: string): Promise<string>
	verify(token: string): Promise<{userId: string} | null>
}
