import {useState} from 'react'
import type {Booking} from '../../../entities/booking'
import {ApiError} from '../../../shared/api'
import {Button} from '../../../shared/ui'
import {cancelBooking} from '../api/cancel-api'


interface CancelButtonProps {
	bookingId: string
	// Контракт изменён: передаём обновлённый Booking родителю, чтобы он мог
	// сделать локальный update без полного refetch — это сохраняет scroll-position.
	// CS-принцип: Information Expert — у нас уже есть актуальный объект из ответа API,
	// тащить его наверх дешевле, чем гонять родителя в reload.
	onCancelled: (booking: Booking) => void
}

export function CancelButton({bookingId, onCancelled}: CancelButtonProps) {
	const [loading, setLoading] = useState(false)
	const [error, setError] = useState<string | null>(null)

	const onClick = async () => {
		setLoading(true)
		setError(null)
		try {
			const updated = await cancelBooking(bookingId)
			onCancelled(updated)
		} catch (e) {
			if (e instanceof ApiError) {
				const body = e.body as {error?: string} | undefined
				setError(body?.error ?? `Ошибка ${e.status}`)
			} else {
				setError(e instanceof Error ? e.message : 'unknown error')
			}
		} finally {
			setLoading(false)
		}
	}

	return (
		<div className="flex items-center gap-2">
			{error && <span className="text-xs text-red-600">{error}</span>}
			<Button variant="secondary" onClick={onClick} disabled={loading}>
				{loading ? '…' : 'Отменить'}
			</Button>
		</div>
	)
}
