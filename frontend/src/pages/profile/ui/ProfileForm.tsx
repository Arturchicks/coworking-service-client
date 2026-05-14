import {useState, type FormEvent} from 'react'
import {ApiError} from '../../../shared/api'
import {Button} from '../../../shared/ui'
import {useAuth} from '../../../features/auth'


export function ProfileForm() {
	const {user, updateProfile} = useAuth()
	const [email, setEmail] = useState(user?.email ?? '')
	const [displayName, setDisplayName] = useState(user?.displayName ?? '')
	const [phone, setPhone] = useState(user?.phone ?? '')
	const [avatarUrl, setAvatarUrl] = useState(user?.avatarUrl ?? '')
	const [loading, setLoading] = useState(false)
	const [message, setMessage] = useState<{kind: 'ok' | 'err'; text: string} | null>(null)

	// Считаем, что поле "очищено" если оно было заполнено и теперь пустое, — отправляем null.
	// Если значение не менялось — отправляем undefined (бэк не тронет колонку).
	// Это и есть PATCH-семантика: undefined ≠ null.
	const submit = async (e: FormEvent) => {
		e.preventDefault()
		setMessage(null)
		setLoading(true)
		try {
			await updateProfile({
				email: email.trim() !== (user?.email ?? '') ? email.trim() : undefined,
				displayName: (displayName.trim() || null) !== (user?.displayName ?? null)
					? (displayName.trim() || null)
					: undefined,
				phone: (phone.trim() || null) !== (user?.phone ?? null)
					? (phone.trim() || null)
					: undefined,
				avatarUrl: (avatarUrl.trim() || null) !== (user?.avatarUrl ?? null)
					? (avatarUrl.trim() || null)
					: undefined,
			})
			setMessage({kind: 'ok', text: 'Профиль сохранён'})
		} catch (err) {
			if (err instanceof ApiError) {
				const body = err.body as {error?: string} | undefined
				setMessage({kind: 'err', text: body?.error ?? `Ошибка ${err.status}`})
			} else {
				setMessage({kind: 'err', text: err instanceof Error ? err.message : 'unknown error'})
			}
		} finally {
			setLoading(false)
		}
	}

	return (
		<form onSubmit={submit} className="space-y-4 p-6 bg-white rounded-lg border">
			<h2 className="text-lg font-semibold">Профиль</h2>

			<label className="block">
				<span className="text-sm text-gray-700">Email (логин)</span>
				<input
					type="email"
					value={email}
					onChange={(e) => setEmail(e.target.value)}
					required
					autoComplete="email"
					className="mt-1 w-full px-3 py-2 border rounded-lg"
				/>
			</label>

			<label className="block">
				<span className="text-sm text-gray-700">Имя</span>
				<input
					type="text"
					value={displayName}
					onChange={(e) => setDisplayName(e.target.value)}
					placeholder="Например, Иван Иванов"
					className="mt-1 w-full px-3 py-2 border rounded-lg"
				/>
			</label>

			<label className="block">
				<span className="text-sm text-gray-700">Телефон</span>
				<input
					type="tel"
					value={phone}
					onChange={(e) => setPhone(e.target.value)}
					placeholder="+7 999 000-00-00"
					autoComplete="tel"
					className="mt-1 w-full px-3 py-2 border rounded-lg"
				/>
			</label>

			<label className="block">
				<span className="text-sm text-gray-700">URL аватара</span>
				<input
					type="url"
					value={avatarUrl}
					onChange={(e) => setAvatarUrl(e.target.value)}
					placeholder="https://i.pravatar.cc/150"
					className="mt-1 w-full px-3 py-2 border rounded-lg"
				/>
				<span className="text-xs text-gray-500 block mt-1">
					Прямая ссылка на изображение (http/https). Можно оставить пустым — покажем инициалы.
				</span>
			</label>

			{message && (
				<p className={message.kind === 'ok' ? 'text-sm text-green-700' : 'text-sm text-red-600'}>
					{message.text}
				</p>
			)}

			<Button type="submit" disabled={loading}>
				{loading ? 'Сохранение…' : 'Сохранить'}
			</Button>
		</form>
	)
}
