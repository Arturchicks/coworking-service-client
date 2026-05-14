import {Badge} from '../../../shared/ui'
import {cn} from '../../../shared/lib'
import type {Subscription} from '../model/subscription'
import {formatExpiry, subscriptionStatusLabel} from '../model/subscription'


interface SubscriptionCardProps {
	subscription: Subscription
	planName?: string
}

export function SubscriptionCard({subscription, planName}: SubscriptionCardProps) {
	const hours = subscription.hoursRemaining == null
		? 'безлимит'
		: `${subscription.hoursRemaining} ч.`

	return (
		<article className={cn(
			'p-4 border rounded-lg bg-white flex items-center justify-between gap-4',
			subscription.status !== 'active' && 'opacity-60',
		)}>
			<div className="space-y-1">
				<div className="flex items-center gap-2">
					<span className="font-semibold">{planName ?? subscription.planId}</span>
					<Badge className={cn(
						subscription.status === 'active' && 'bg-green-100 text-green-800',
						subscription.status === 'expired' && 'bg-gray-200 text-gray-700',
						subscription.status === 'exhausted' && 'bg-gray-200 text-gray-700',
					)}>
						{subscriptionStatusLabel(subscription.status)}
					</Badge>
				</div>
				<div className="text-sm text-gray-600">Осталось: {hours}</div>
				<div className="text-xs text-gray-500">Действует до: {formatExpiry(subscription.expiresAt)}</div>
			</div>
		</article>
	)
}
