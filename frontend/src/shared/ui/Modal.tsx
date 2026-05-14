import {useEffect, useRef, type ReactNode} from 'react'


interface ModalProps {
	open: boolean
	onClose: () => void
	title?: string
	icon?: ReactNode
	children: ReactNode
}

/**
 * Модальное окно на базе нативного `<dialog>`. Преимущества над "дивами с Portal":
 *   - Focus trap встроен (Tab не вылезает из dialog).
 *   - Esc закрывает (через onCancel event).
 *   - inert background — клики и aria-навигация в body отключены автоматически.
 *   - Backdrop стилизуется через ::backdrop CSS-псевдоэлемент.
 *
 * Класс `app-modal` подключает CSS-анимацию fade+scale из styles.css
 * (через @starting-style — CSS Transitions Level 2).
 *
 * Поддержка <dialog>: Chrome 37+, Safari 15.4+, Firefox 98+ — все актуальные браузеры 2026.
 * Источник: https://developer.mozilla.org/en-US/docs/Web/HTML/Element/dialog
 */
export function Modal({open, onClose, title, icon, children}: ModalProps) {
	const ref = useRef<HTMLDialogElement>(null)

	useEffect(() => {
		const el = ref.current
		if (!el) return
		if (open && !el.open) el.showModal()
		else if (!open && el.open) el.close()
	}, [open])

	return (
		<dialog
			ref={ref}
			onCancel={(e) => {
				// Esc вызывает onCancel; preventDefault бесполезен — dialog всё равно закроется,
				// но мы зовём onClose, чтобы React-state совпал с DOM-state.
				e.preventDefault()
				onClose()
			}}
			onClick={(e) => {
				// Клик по backdrop'у — target === сам <dialog>. По content внутри — target ≠ dialog.
				if (e.target === ref.current) onClose()
			}}
			className="app-modal rounded-xl p-0 max-w-md w-full shadow-2xl"
		>
			<div className="p-6 space-y-3">
				{(icon || title) && (
					<div className="flex items-center gap-3">
						{icon}
						{title && <h2 className="text-lg font-semibold">{title}</h2>}
					</div>
				)}
				<div>{children}</div>
			</div>
		</dialog>
	)
}
