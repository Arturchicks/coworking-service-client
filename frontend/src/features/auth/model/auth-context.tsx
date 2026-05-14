import {createContext, useCallback, useContext, useEffect, useState, type ReactNode} from 'react'
import {ApiError} from '../../../shared/api'
import {
	AuthUser, Credentials, ProfilePatch,
	changePassword as apiChangePassword,
	fetchMe,
	login as apiLogin,
	logout as apiLogout,
	register as apiRegister,
	updateProfile as apiUpdateProfile,
} from '../api/auth-api'


type Status = 'loading' | 'authenticated' | 'anonymous'

interface AuthContextValue {
	status: Status
	user: AuthUser | null
	login: (creds: Credentials) => Promise<void>
	register: (creds: Credentials) => Promise<void>
	logout: () => Promise<void>
	updateProfile: (patch: ProfilePatch) => Promise<void>
	changePassword: (currentPassword: string, newPassword: string) => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({children}: {children: ReactNode}) {
	const [user, setUser] = useState<AuthUser | null>(null)
	const [status, setStatus] = useState<Status>('loading')

	useEffect(() => {
		fetchMe()
			.then((r) => {
				setUser(r.user)
				setStatus('authenticated')
			})
			.catch((e) => {
				if (e instanceof ApiError && e.status === 401) {
					setStatus('anonymous')
					return
				}
				setStatus('anonymous')
			})
	}, [])

	const login = useCallback(async (creds: Credentials) => {
		const {user: u} = await apiLogin(creds)
		setUser(u)
		setStatus('authenticated')
	}, [])

	const register = useCallback(async (creds: Credentials) => {
		const {user: u} = await apiRegister(creds)
		setUser(u)
		setStatus('authenticated')
	}, [])

	const logout = useCallback(async () => {
		await apiLogout()
		setUser(null)
		setStatus('anonymous')
	}, [])

	// updateProfile: PATCH /auth/me — backend возвращает обновлённый user,
	// мы доверяем ему как Source of Truth и заменяем локальный state.
	const updateProfile = useCallback(async (patch: ProfilePatch) => {
		const {user: u} = await apiUpdateProfile(patch)
		setUser(u)
	}, [])

	const changePassword = useCallback(async (currentPassword: string, newPassword: string) => {
		await apiChangePassword(currentPassword, newPassword)
		// Текущая JWT-сессия остаётся валидной до её естественной expiration —
		// сервер не инвалидирует токены. Это accepted limitation MVP (см. CHANGE_PASSWORD use case).
	}, [])

	return (
		<AuthContext.Provider value={{status, user, login, register, logout, updateProfile, changePassword}}>
			{children}
		</AuthContext.Provider>
	)
}

export function useAuth(): AuthContextValue {
	const ctx = useContext(AuthContext)
	if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>')
	return ctx
}
