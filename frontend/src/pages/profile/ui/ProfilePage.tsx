import {Avatar} from '../../../entities/user'
import {useAuth} from '../../../features/auth'
import {ProfileForm} from './ProfileForm'
import {PasswordForm} from './PasswordForm'


export function ProfilePage() {
	const {user} = useAuth()
	if (!user) return null // AuthGate уже отрендерит login — сюда не должны попасть

	return (
		<main className="max-w-2xl mx-auto p-8 space-y-6">
			<header className="flex items-center gap-4">
				<Avatar
					avatarUrl={user.avatarUrl}
					email={user.email}
					displayName={user.displayName}
					size="lg"
				/>
				<div>
					<h1 className="text-2xl font-bold">{user.displayName || user.email}</h1>
					<p className="text-sm text-gray-600">{user.email}</p>
				</div>
			</header>

			<ProfileForm />
			<PasswordForm />
		</main>
	)
}
