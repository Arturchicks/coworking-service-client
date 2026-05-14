import {useCallback, useEffect, useState} from 'react'
import type {Booking} from '../../../entities/booking'
import {useAuth} from '../../auth'
import {fetchMyBookings} from '../api/my-bookings-api'


export function useMyBookings() {
	const {user} = useAuth()
	const [bookings, setBookings] = useState<Booking[]>([])
	const [loading, setLoading] = useState(false)
	const [error, setError] = useState<string | null>(null)

	const reload = useCallback(async () => {
		if (!user) return
		setLoading(true)
		setError(null)
		try {
			const data = await fetchMyBookings()
			setBookings(data)
		} catch (e) {
			setError(e instanceof Error ? e.message : 'unknown error')
		} finally {
			setLoading(false)
		}
	}, [user])

	// Локальный update — заменяет конкретную бронь в state, не дёргая refetch.
	// CS-принципы:
	//   - Принцип минимальной мутации: один объект меняется, остальные тождественны (===).
	//     React reconciliation видит, что элементы по `key` не изменились — DOM-ноды
	//     переиспользуются, scroll-position сохраняется (нет mount/unmount).
	//   - Source of Truth: backend всё равно вернул обновлённый Booking — мы доверяем
	//     ему вместо локального optimistic'а. Это не optimistic update, это server-confirmed.
	const updateLocal = useCallback((updated: Booking) => {
		setBookings((prev) => prev.map((b) => (b.id === updated.id ? updated : b)))
	}, [])

	useEffect(() => {
		reload()
	}, [reload])

	return {bookings, loading, error, reload, updateLocal}
}
