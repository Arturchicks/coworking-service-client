// Port для хеширования паролей. Реализация (bcrypt) живёт в infrastructure.
// CS-принцип: Dependency Inversion (SOLID DIP) + Ports & Adapters (Hexagonal).
// Application и domain не знают, что хеширование делает bcrypt;
// тесты могут подсунуть FakePasswordHasher (всегда возвращает 'hashed:<plain>').
//
// Почему интерфейс именно такой:
//   - hash() — асинхронный, потому что bcrypt CPU-затратен, работает через libuv thread pool;
//   - verify() — отдельный метод, потому что bcrypt-comparing использует константное время
//     (защита от timing attacks). Сами строки сравнивать через === НЕЛЬЗЯ.
export interface PasswordHasher {
	hash(plain: string): Promise<string>
	verify(plain: string, hash: string): Promise<boolean>
}
