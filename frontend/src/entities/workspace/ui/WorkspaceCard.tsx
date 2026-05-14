import type {ReactNode} from 'react'
import {Badge} from '../../../shared/ui'
import {cn} from '../../../shared/lib'
import type {Workspace} from '../model/workspace'
import {formatPrice, workspaceTypeLabel} from '../model/workspace'


interface WorkspaceCardProps {
	workspace: Workspace
	actions?: ReactNode
	highlight?: boolean
	className?: string
}

export function WorkspaceCard({workspace, actions, highlight, className}: WorkspaceCardProps) {
	return (
		<article className={cn(
			'p-4 border rounded-lg bg-white flex items-center justify-between gap-4',
			highlight && 'border-green-300 ring-1 ring-green-200',
			className,
		)}>
			<div className="space-y-1">
				<div className="flex items-center gap-2">
					<span className="font-semibold">{workspace.name}</span>
					<Badge className={cn(
						workspace.type === 'hot_desk' && 'bg-blue-100 text-blue-800',
						workspace.type === 'meeting_room' && 'bg-purple-100 text-purple-800',
					)}>
						{workspaceTypeLabel(workspace.type)}
					</Badge>
				</div>
				<div className="text-sm text-gray-500">
					Вместимость: {workspace.capacity} · {formatPrice(workspace.pricePerHour)}/час
				</div>
			</div>
			{actions && <div className="flex items-center gap-2">{actions}</div>}
		</article>
	)
}
