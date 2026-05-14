import { ReactNode } from 'react'
import {cn} from '../lib'


interface BadgeProps {
	children: ReactNode
	className?: string
}

export function Badge({children, className}: BadgeProps) {
	return (
		<span className={cn('px-2 py-1 rounded text-sm font-mono font-semibold', className)}>
			{children}
		</span>
	)
}