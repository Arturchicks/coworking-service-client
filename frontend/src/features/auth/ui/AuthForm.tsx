import {useMemo, useState, type FormEvent} from 'react'
import {ApiError} from '../../../shared/api'
import {cn, evaluatePassword, isPasswordAcceptable} from '../../../shared/lib'
import {Button, PasswordStrengthMeter} from '../../../shared/ui'
import {useAuth} from '../model/auth-context'


type Mode = 'login' | 'register'

interface AuthFormProps {
	initialMode?: Mode
}

const baseInput = 'mt-1 w-full px-3 py-2 border rounded-lg transition-colors'
function inputClass(invalid: boolean) {
	return cn(
		baseInput,
		invalid
			? 'border-red-400 focus:border-red-500 focus:ring-1 focus:ring-red-300 outline-none'
			: 'border-gray-300',
	)
}

export function AuthForm({initialMode = 'login'}: AuthFormProps) {
	const {login, register} = useAuth()
	const [mode, setMode] = useState<Mode>(initialMode)
	const [email, setEmail] = useState('')
	const [password, setPassword] = useState('')
	const [touchedPassword, setTouchedPassword] = useState(false)
	const [error, setError] = useState<string | null>(null)
	const [loading, setLoading] = useState(false)

	// strength считаем только в register-mode — на login проверка силы пароля бессмысленна
	// (юзер вводит свой ранее сохранённый, mer его слабость нам не помощь, только шум).
	const strength = useMemo(() => evaluatePassword(password), [password])

	// Inline-валидация — ТОЛЬКО для register. На login любая длина допустима
	// (юзер мог раньше зарегаться с коротким паролем — пусть БД отдаст 401, не блокируем фронтом).
	const passwordInvalid =
		mode === 'register'
		&& (touchedPassword || password.length > 0)
		&& password.length > 0
		&& !isPasswordAcceptable(password)

	const canSubmit = !loading
		&& email.length > 0
		&& (mode === 'login' || isPasswordAcceptable(password))

	const submit = async (e: FormEvent) => {
		e.preventDefault()
		setError(null)
		if (mode === 'register') {
			setTouchedPassword(true)
			if (!isPasswordAcceptable(password)) return
		}
		setLoading(true)
		try {
			if (mode === 'login') await login({email, password})
			else await register({email, password})
		} catch (err) {
			if (err instanceof ApiError) {
				const body = err.body as {error?: string} | undefined
				setError(body?.error ?? `Ошибка ${err.status}`)
			} else {
				setError(err instanceof Error ? err.message : 'unknown error')
			}
		} finally {
			setLoading(false)
		}
	}

	return (
		<main className="max-w-md mx-auto p-8 space-y-4 animate-page-in">
			<div className="flex gap-2 mb-2">
				<button
					type="button"
					onClick={() => setMode('login')}
					className={`px-3 py-1 rounded transition-colors ${mode === 'login' ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}
				>
					Вход
				</button>
				<button
					type="button"
					onClick={() => setMode('register')}
					className={`px-3 py-1 rounded transition-colors ${mode === 'register' ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}
				>
					Регистрация
				</button>
			</div>

			<div key={mode} className="animate-page-in space-y-4">
				<h1 className="text-2xl font-bold">
					{mode === 'login' ? 'Вход в Coworking' : 'Создать аккаунт'}
				</h1>
				<p className="text-sm text-gray-600">
					{mode === 'register'
						? 'Пароль ≥ 8 символов. Логин — по email.'
						: 'Войдите, чтобы бронировать места и видеть свои брони.'}
				</p>

				<form className="space-y-3" onSubmit={submit} noValidate>
					<label className="block">
						<span className="text-sm text-gray-700">Email</span>
						<input
							type="email"
							value={email}
							onChange={(e) => setEmail(e.target.value)}
							required
							autoComplete="email"
							className={inputClass(false)}
						/>
					</label>
					<label className="block">
						<span className="text-sm text-gray-700">Пароль</span>
						<input
							type="password"
							value={password}
							onChange={(e) => setPassword(e.target.value)}
							onBlur={() => setTouchedPassword(true)}
							required
							autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
							aria-invalid={passwordInvalid}
							className={inputClass(passwordInvalid)}
						/>
						{passwordInvalid && (
							<p className="text-xs text-red-600 mt-1">Минимум 8 символов</p>
						)}
						{mode === 'register' && <PasswordStrengthMeter result={strength} />}
					</label>
					{error && <p className="text-sm text-red-600">{error}</p>}
					<Button type="submit" disabled={!canSubmit}>
						{loading ? '…' : mode === 'login' ? 'Войти' : 'Создать аккаунт'}
					</Button>
				</form>
			</div>
		</main>
	)
}
