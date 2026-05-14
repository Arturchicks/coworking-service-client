import {useEffect, useMemo, useState} from 'react'
import {BookingCard} from '../../../entities/booking'
import type {Workspace} from '../../../entities/workspace'
import {fetchAllWorkspaces} from '../../../features/list-workspaces/api/workspaces-api'
import {useMyBookings} from '../../../features/list-my-bookings'
import {CancelButton} from '../../../features/cancel-booking'


export function MyBookingsPage() {
	const {bookings, loading, error, updateLocal} = useMyBookings()
	const [workspaces, setWorkspaces] = useState<Workspace[]>([])

	const workspaceById = useMemo(() => {
		const m = new Map<string, Workspace>()
		for (const w of workspaces) m.set(w.id, w)
		return m
	}, [workspaces])

	// Тащим каталог однажды — чтобы показать имя workspace вместо UUID.
	// Альтернатива: backend мог бы возвращать joined workspace_name в /bookings/mine.
	// Trade-off: меньше круглых походов VS меньше сложности на бэке. На MVP — фронт.
	useEffect(() => {
		fetchAllWorkspaces().then(setWorkspaces).catch(() => {/* ignore */})
	}, [])

	return (
		<main className="max-w-3xl mx-auto p-8 space-y-6">
			<header>
				<h1 className="text-2xl font-bold">Мои бронирования</h1>
			</header>

			{error && <p className="p-4 bg-red-50 text-red-800 rounded-lg">Ошибка: {error}</p>}

			{!loading && bookings.length === 0 && (
				<p className="p-4 bg-gray-50 text-gray-700 rounded-lg">У вас пока нет бронирований.</p>
			)}

			<section className="space-y-3">
				{bookings.map((b) => (
					<BookingCard
						key={b.id}
						booking={b}
						workspaceName={workspaceById.get(b.workspaceId)?.name}
						actions={
							b.status === 'active'
								? <CancelButton bookingId={b.id} onCancelled={updateLocal} />
								: null
						}
					/>
				))}
			</section>
		</main>
	)
}
