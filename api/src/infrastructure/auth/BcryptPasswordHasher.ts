import bcrypt from 'bcryptjs'
import {PasswordHasher} from '../../domain/users/PasswordHasher'


// Адаптер для порта PasswordHasher.
// bcryptjs vs bcrypt: первый — pure JS (нет native dep, переносим), второй — native C++ (быстрее).
// На MVP bcryptjs достаточно (логин редко). При нагрузке — переключи на 'bcrypt' с тем же API.
//
// Cost factor = 10 — стандарт 2026. Чем выше, тем дольше bcrypt считает hash и тем дороже brute-force.
// Время на современном железе при cost=10: ~50-100ms. cost=12: ~300ms. Подбирается под "длинно для атакующего, незаметно для юзера".
// Источник: https://owasp.org/www-project-cheat-sheets/cheatsheets/Password_Storage_Cheat_Sheet.html
const COST_FACTOR = 10

export class BcryptPasswordHasher implements PasswordHasher {
	async hash(plain: string): Promise<string> {
		return bcrypt.hash(plain, COST_FACTOR)
	}

	async verify(plain: string, hash: string): Promise<boolean> {
		// bcrypt.compare использует константное время (защита от timing attacks).
		// Никогда не делай `plain === hash` — это утечка через тайминг.
		try {
			return await bcrypt.compare(plain, hash)
		} catch {
			// Битый hash или невалидный формат — считаем не подошёл, не бросаем.
			return false
		}
	}
}
