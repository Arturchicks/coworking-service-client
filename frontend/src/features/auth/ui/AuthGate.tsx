import type {ReactNode} from 'react'
import {useAuth} from '../model/auth-context'
import {AuthForm} from './AuthForm'


interface AuthGateProps {
	children: ReactNode
}

export function AuthGate({children}: AuthGateProps) {
	const {status} = useAuth()

	if (status === 'loading') {
		return (
			<main className="max-w-md mx-auto p-8">
				<p className="text-gray-500">Загрузка…</p>
			</main>
		)
	}

	if (status === 'anonymous') {
		return <AuthForm />
	}

	return <>{children}</>
}
