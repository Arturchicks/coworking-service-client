import {useNavigate} from 'react-router-dom'
import {PlanCard} from '../../../entities/plan'
import {usePlans} from '../../../features/list-plans'
import {PurchaseButton} from '../../../features/purchase-plan'


export function PlansPage() {
	const {plans, loading, error} = usePlans()
	const navigate = useNavigate()

	return (
		<main className="max-w-3xl mx-auto p-8 space-y-6">
			<header>
				<h1 className="text-2xl font-bold">Тарифы</h1>
				<p className="text-sm text-gray-600 mt-1">
					Чтобы бронировать места, оформите подписку. Оплата — mock-эквайринг для прототипа.
				</p>
			</header>

			{loading && <p className="text-gray-500">Загрузка…</p>}
			{error && <p className="p-4 bg-red-50 text-red-800 rounded-lg">Ошибка: {error}</p>}

			<section className="space-y-3">
				{plans.map((p) => (
					<PlanCard
						key={p.id}
						plan={p}
						actions={
							<PurchaseButton
								planId={p.id}
								onPurchased={() => navigate('/subscriptions')}
							/>
						}
					/>
				))}
			</section>
		</main>
	)
}
