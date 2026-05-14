import {ButtonHTMLAttributes} from 'react'
import {cn} from '../lib'


interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
	variant?: 'primary' | 'secondary'
}

export function Button({variant = 'primary', className, ...props}: ButtonProps) {
	return (
		<button
			className={cn(
				'px-4 py-2 rounded font-medium transition-colors',
				variant === 'primary' && 'bg-blue-600 text-white hover:bg-blue-700',
				variant === 'secondary' && 'bg-gray-200 text-gray-800 hover:bg-gray-300',
				className,
			)}
			{...props}
		/>
	)
}
