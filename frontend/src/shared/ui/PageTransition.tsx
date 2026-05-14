import type {ReactNode} from 'react'
import {useLocation} from 'react-router-dom'


interface PageTransitionProps {
	children: ReactNode
}

/**
 * Обёртка над <Routes> для проигрывания CSS-анимации появления на смену маршрута.
 *
 * Как работает: `key={location.pathname}` заставляет React считать поддерево другим
 * элементом при смене URL — старый размонтируется, новый смонтируется. Mount
 * автоматически триггерит CSS-анимацию `animate-page-in` (см. styles.css).
 *
 * Trade-off: при каждом переходе теряется state дочерних страниц (scroll, локальные
 * useState). Для MVP, где страницы без сохраняемого состояния, это OK. Если state
 * понадобится — нужен framer-motion / view-transitions-api / ручное keep-alive.
 */
export function PageTransition({children}: PageTransitionProps) {
	const location = useLocation()
	return (
		<div key={location.pathname} className="animate-page-in">
			{children}
		</div>
	)
}
