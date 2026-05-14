import {ReactNode} from 'react'
import {Badge} from '../../../shared/ui'
import {cn} from '../../../shared/lib'
import {formatPrice} from '../../workspace'
import {Booking, formatInterval} from '../model/booking'


interface BookingCardProps {
	booking: Booking
	workspaceName?: string
	actions?: ReactNode
}

export function BookingCard({booking, workspaceName, actions}: BookingCardProps) {
	return (
		<article className={cn(
			'p-4 border rounded-lg bg-white flex items-center justify-between gap-4',
			booking.status === 'cancelled' && 'opacity-60',
		)}>
			<div className="space-y-1">
				<div className="flex items-center gap-2">
					<span className="font-semibold">{workspaceName ?? booking.workspaceId}</span>
					<Badge className={cn(
						booking.status === 'active' && 'bg-green-100 text-green-800',
						booking.status === 'cancelled' && 'bg-gray-200 text-gray-700',
					)}>
						{booking.status === 'active' ? 'активна' : 'отменена'}
					</Badge>
				</div>
				<div className="text-sm text-gray-600">{formatInterval(booking)}</div>
				<div className="text-xs text-gray-500">Сумма: {formatPrice(booking.totalPrice)}</div>
			</div>
			{actions && <div className="flex items-center gap-2">{actions}</div>}
		</article>
	)
}
