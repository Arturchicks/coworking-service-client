import {useMemo, useState, type FormEvent} from 'react'
import {ApiError} from '../../../shared/api'
import {cn, evaluatePassword, isPasswordAcceptable} from '../../../shared/lib'
import {Button, PasswordStrengthMeter} from '../../../shared/ui'
import {useAuth} from '../../../features/auth'


// Стиль input'а — выносим, чтобы не дублировать классы между тремя полями.
// Красная рамка применяется когда поле touched + невалидно — NN/g best practice:
// "validation should not show errors on empty/untouched fields".
const baseInput = 'mt-1 w-full px-3 py-2 border rounded-lg transition-colors'
function inputClass(invalid: boolean) {
	return cn(
		baseInput,
		invalid
			? 'border-red-400 focus:border-red-500 focus:ring-1 focus:ring-red-300 outline-none'
			: 'border-gray-300',
	)
}

export function PasswordForm() {
	const {changePassword} = useAuth()
	const [currentPassword, setCurrent] = useState('')
	const [newPassword, setNew] = useState('')
	const [confirmPassword, setConfirm] = useState('')
	// touched-флаги: validation срабатывает после первого blur'а или попытки submit.
	const [touchedNew, setTouchedNew] = useState(false)
	const [touchedConfirm, setTouchedConfirm] = useState(false)
	const [loading, setLoading] = useState(false)
	const [submitMessage, setSubmitMessage] = useState<{kind: 'ok' | 'err'; text: string} | null>(null)

	// Pure-функция evaluatePassword вызывается на каждый keystroke — на длинном пароле
	// regex'ы стоят ~µs. useMemo держит ссылку стабильной для пропса в meter.
	const strength = useMemo(() => evaluatePassword(newPassword), [newPassword])

	const newTooShort = newPassword.length > 0 && !isPasswordAcceptable(newPassword)
	const confirmMismatch = confirmPassword.length > 0 && confirmPassword !== newPassword

	const newInvalid = (touchedNew || newPassword.length > 0) && newTooShort
	const confirmInvalid = (touchedConfirm || confirmPassword.length > 0) && confirmMismatch

	const canSubmit = currentPassword.length > 0
		&& isPasswordAcceptable(newPassword)
		&& confirmPassword === newPassword
		&& !loading

	const submit = async (e: FormEvent) => {
		e.preventDefault()
		setSubmitMessage(null)
		setTouchedNew(true)
		setTouchedConfirm(true)
		if (!isPasswordAcceptable(newPassword) || newPassword !== confirmPassword) return
		setLoading(true)
		try {
			await changePassword(currentPassword, newPassword)
			setSubmitMessage({kind: 'ok', text: 'Пароль изменён'})
			setCurrent(''); setNew(''); setConfirm('')
			setTouchedNew(false); setTouchedConfirm(false)
		} catch (err) {
			if (err instanceof ApiError) {
				const body = err.body as {error?: string} | undefined
				setSubmitMessage({kind: 'err', text: body?.error ?? `Ошибка ${err.status}`})
			} else {
				setSubmitMessage({kind: 'err', text: err instanceof Error ? err.message : 'unknown error'})
			}
		} finally {
			setLoading(false)
		}
	}

	return (
		<form onSubmit={submit} className="space-y-4 p-6 bg-white rounded-lg border" noValidate>
			<h2 className="text-lg font-semibold">Смена пароля</h2>
			<p className="text-sm text-gray-600">
				Текущий пароль обязателен — это защита от смены пароля при угоне сессии.
			</p>

			<label className="block">
				<span className="text-sm text-gray-700">Текущий пароль</span>
				<input
					type="password"
					value={currentPassword}
					onChange={(e) => setCurrent(e.target.value)}
					required
					autoComplete="current-password"
					className={inputClass(false)}
				/>
			</label>

			<label className="block">
				<span className="text-sm text-gray-700">Новый пароль</span>
				<input
					type="password"
					value={newPassword}
					onChange={(e) => setNew(e.target.value)}
					onBlur={() => setTouchedNew(true)}
					required
					autoComplete="new-password"
					aria-invalid={newInvalid}
					className={inputClass(newInvalid)}
				/>
				{newInvalid && (
					<p className="text-xs text-red-600 mt-1">Минимум 8 символов</p>
				)}
				<PasswordStrengthMeter result={strength} />
			</label>

			<label className="block">
				<span className="text-sm text-gray-700">Подтверждение нового пароля</span>
				<input
					type="password"
					value={confirmPassword}
					onChange={(e) => setConfirm(e.target.value)}
					onBlur={() => setTouchedConfirm(true)}
					required
					autoComplete="new-password"
					aria-invalid={confirmInvalid}
					className={inputClass(confirmInvalid)}
				/>
				{confirmInvalid && (
					<p className="text-xs text-red-600 mt-1">Пароли не совпадают</p>
				)}
			</label>

			{submitMessage && (
				<p className={submitMessage.kind === 'ok' ? 'text-sm text-green-700' : 'text-sm text-red-600'}>
					{submitMessage.text}
				</p>
			)}

			<Button type="submit" disabled={!canSubmit}>
				{loading ? 'Сохранение…' : 'Сменить пароль'}
			</Button>
		</form>
	)
}
