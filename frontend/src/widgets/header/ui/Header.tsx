import {Link, NavLink} from 'react-router-dom'
import {Avatar} from '../../../entities/user'
import {Button} from '../../../shared/ui'
import {cn} from '../../../shared/lib'
import {useAuth} from '../../../features/auth'


export function Header() {
	const {user, logout} = useAuth()

	return (
		<header
			className={cn(
				'fixed top-0 inset-x-0 z-50',
				'bg-white/70 backdrop-blur-sm',
				'border-b border-gray-200/60 shadow-sm',
				'px-6 py-4 flex items-center justify-between',
			)}
		>
			<div className="flex items-center gap-6">
				<Link to="/" className="font-bold text-lg">Coworking</Link>
				<nav className="flex items-center gap-3 text-sm">
					<NavLink to="/" end className={({isActive}) => cn('px-2 py-1 rounded transition-colors', isActive && 'bg-gray-100/80')}>
						Места
					</NavLink>
					<NavLink to="/my" className={({isActive}) => cn('px-2 py-1 rounded transition-colors', isActive && 'bg-gray-100/80')}>
						Мои брони
					</NavLink>
					<NavLink to="/plans" className={({isActive}) => cn('px-2 py-1 rounded transition-colors', isActive && 'bg-gray-100/80')}>
						Тарифы
					</NavLink>
					<NavLink to="/subscriptions" className={({isActive}) => cn('px-2 py-1 rounded transition-colors', isActive && 'bg-gray-100/80')}>
						Подписки
					</NavLink>
				</nav>
			</div>
			{user && (
				<div className="flex items-center gap-3 text-sm">
					<Link to="/profile" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
						<Avatar
							avatarUrl={user.avatarUrl}
							email={user.email}
							displayName={user.displayName}
							size="sm"
						/>
						<span className="text-gray-700">{user.displayName || user.email}</span>
					</Link>
					<Button variant="secondary" onClick={() => logout()}>Выйти</Button>
				</div>
			)}
		</header>
	)
}
