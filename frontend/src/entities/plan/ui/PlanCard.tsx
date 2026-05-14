import type {ReactNode} from 'react'
import {Badge} from '../../../shared/ui'
import {cn} from '../../../shared/lib'
import {formatPrice} from '../../workspace'
import type {Plan} from '../model/plan'
import {planTypeLabel} from '../model/plan'


interface PlanCardProps {
	plan: Plan
	actions?: ReactNode
}

export function PlanCard({plan, actions}: PlanCardProps) {
	const detail = plan.type === 'hours_pack'
		? `${plan.includedHours ?? '?'} часов, действует ${plan.durationDays} дн.`
		: `Безлимит на ${plan.durationDays} ${plan.durationDays === 1 ? 'день' : 'дней'}`

	return (
		<article className="p-4 border rounded-lg bg-white flex items-center justify-between gap-4">
			<div className="space-y-1">
				<div className="flex items-center gap-2">
					<span className="font-semibold">{plan.name}</span>
					<Badge className={cn(
						plan.type === 'hours_pack' && 'bg-amber-100 text-amber-800',
						plan.type === 'unlimited_period' && 'bg-emerald-100 text-emerald-800',
					)}>
						{planTypeLabel(plan.type)}
					</Badge>
				</div>
				<div className="text-sm text-gray-600">{detail}</div>
				<div className="text-base font-medium">{formatPrice(plan.price)}</div>
			</div>
			{actions && <div className="flex items-center gap-2">{actions}</div>}
		</article>
	)
}
