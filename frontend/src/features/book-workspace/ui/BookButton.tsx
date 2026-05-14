import {useState} from 'react'
import {Link} from 'react-router-dom'
import {ApiError} from '../../../shared/api'
import {Button, Modal, WarningIcon} from '../../../shared/ui'
import {createBooking} from '../api/bookings-api'


interface BookButtonProps {
	workspaceId: string
	startsAt: string | null
	endsAt: string | null
	onBooked: () => void
}

type Status =
	| {kind: 'idle'}
	| {kind: 'success'}
	| {kind: 'conflict'}
	| {kind: 'subscription_required'}
	| {kind: 'error'; message: string}

export function BookButton({workspaceId, startsAt, endsAt, onBooked}: BookButtonProps) {
	const [loading, setLoading] = useState(false)
	const [status, setStatus] = useState<Status>({kind: 'idle'})
	// Модалка-предупреждение: открывается, если кликают «Забронировать» без интервала.
	// Альтернатива — disabled-кнопка. Trade-off: модалка явно сообщает почему,
	// disabled-кнопка молча игнорирует — хуже для UX (см. NN/g "Visibility of system status").
	const [showHint, setShowHint] = useState(false)

	const onClick = async () => {
		if (!startsAt || !endsAt) {
			setShowHint(true)
			return
		}
		setLoading(true)
		setStatus({kind: 'idle'})
		try {
			await createBooking({workspaceId, startsAt, endsAt})
			setStatus({kind: 'success'})
			onBooked()
		} catch (e) {
			if (e instanceof ApiError) {
				if (e.status === 402) setStatus({kind: 'subscription_required'})
				else if (e.status === 409) setStatus({kind: 'conflict'})
				else {
					const body = e.body as {error?: string} | undefined
					setStatus({kind: 'error', message: body?.error ?? `Ошибка ${e.status}`})
				}
			} else {
				setStatus({kind: 'error', message: e instanceof Error ? e.message : 'unknown error'})
			}
		} finally {
			setLoading(false)
		}
	}

	return (
		<div className="flex items-center gap-2">
			{status.kind === 'success' && <span className="text-xs text-green-700">Забронировано</span>}
			{status.kind === 'conflict' && <span className="text-xs text-amber-700">Уже занято</span>}
			{status.kind === 'subscription_required' && (
				<span className="text-xs text-gray-700">
					Нужна подписка. <Link to="/plans" className="text-blue-600 hover:underline">Купить</Link>
				</span>
			)}
			{status.kind === 'error' && <span className="text-xs text-red-600">{status.message}</span>}
			<Button onClick={onClick} disabled={loading}>
				{loading ? '…' : 'Забронировать'}
			</Button>

			<Modal
				open={showHint}
				onClose={() => setShowHint(false)}
				title="Выберите интервал"
				icon={<WarningIcon className="w-6 h-6 text-amber-500" />}
			>
				<p className="text-sm text-gray-700">
					Чтобы забронировать место, сначала выберите интервал в фильтре наверху и
					нажмите <b>«Показать свободные»</b>.
				</p>
				<div className="pt-3 flex justify-end">
					<Button onClick={() => setShowHint(false)}>Понятно</Button>
				</div>
			</Modal>
		</div>
	)
}
