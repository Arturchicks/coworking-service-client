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
				// disabled:* — Tailwind-вариант: правило активно только при HTML-атрибуте disabled.
				// Гасим непрозрачность и ставим not-allowed-курсор.
				'disabled:opacity-50 disabled:cursor-not-allowed',
				// disabled:hover:* нейтрализует hover-цвет варианта (иначе наведение на disabled
				// кнопку всё равно меняло бы фон). Держим рядом с самим variant'ом — так очевидно,
				// какой hover мы перебиваем.
				variant === 'primary' && 'bg-blue-600 text-white hover:bg-blue-700 disabled:hover:bg-blue-600',
				variant === 'secondary' && 'bg-gray-200 text-gray-800 hover:bg-gray-300 disabled:hover:bg-gray-200',
				className,
			)}
			{...props}
		/>
	)
}
