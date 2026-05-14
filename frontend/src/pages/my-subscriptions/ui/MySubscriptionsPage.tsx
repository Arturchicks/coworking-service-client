import {useEffect, useMemo, useState} from 'react'
import {Link} from 'react-router-dom'
import {SubscriptionCard} from '../../../entities/subscription'
import type {Plan} from '../../../entities/plan'
import {fetchPlans} from '../../../features/list-plans'
import {useMySubscriptions} from '../../../features/list-my-subscriptions'


export function MySubscriptionsPage() {
	const {subs, loading, error} = useMySubscriptions()
	const [plans, setPlans] = useState<Plan[]>([])

	useEffect(() => {
		fetchPlans().then(setPlans).catch(() => {/* ignore */})
	}, [])

	const planById = useMemo(() => {
		const m = new Map<string, Plan>()
		for (const p of plans) m.set(p.id, p)
		return m
	}, [plans])

	return (
		<main className="max-w-3xl mx-auto p-8 space-y-6">
			<header className="flex items-center justify-between">
				<h1 className="text-2xl font-bold">Мои подписки</h1>
				<Link to="/plans" className="text-sm text-blue-600 hover:underline">Купить ещё →</Link>
			</header>

			{error && <p className="p-4 bg-red-50 text-red-800 rounded-lg">Ошибка: {error}</p>}

			{!loading && subs.length === 0 && (
				<p className="p-4 bg-gray-50 text-gray-700 rounded-lg">
					Пока нет подписок. <Link to="/plans" className="text-blue-600 hover:underline">Перейти к тарифам</Link>.
				</p>
			)}

			<section className="space-y-3">
				{subs.map((s) => (
					<SubscriptionCard
						key={s.id}
						subscription={s}
						planName={planById.get(s.planId)?.name}
					/>
				))}
			</section>
		</main>
	)
}
