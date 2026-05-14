import {useState} from 'react'
import {ApiError} from '../../../shared/api'
import {Button} from '../../../shared/ui'
import {purchasePlan} from '../api/purchase-api'


interface PurchaseButtonProps {
	planId: string
	onPurchased: () => void
}

export function PurchaseButton({planId, onPurchased}: PurchaseButtonProps) {
	const [loading, setLoading] = useState(false)
	const [message, setMessage] = useState<string | null>(null)

	const onClick = async () => {
		setLoading(true)
		setMessage(null)
		try {
			await purchasePlan(planId)
			setMessage('Куплено')
			onPurchased()
		} catch (e) {
			if (e instanceof ApiError) {
				const body = e.body as {error?: string} | undefined
				setMessage(body?.error ?? `Ошибка ${e.status}`)
			} else {
				setMessage(e instanceof Error ? e.message : 'unknown error')
			}
		} finally {
			setLoading(false)
		}
	}

	return (
		<div className="flex items-center gap-2">
			{message && <span className="text-xs text-gray-600">{message}</span>}
			<Button onClick={onClick} disabled={loading}>
				{loading ? 'Оплата…' : 'Купить'}
			</Button>
		</div>
	)
}
