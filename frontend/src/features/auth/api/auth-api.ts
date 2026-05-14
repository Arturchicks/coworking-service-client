import {apiFetch} from '../../../shared/api'


export interface AuthUser {
	id: string
	email: string
	displayName: string | null
	phone: string | null
	avatarUrl: string | null
	createdAt: string
}

export interface Credentials {
	email: string
	password: string
}

// `undefined` = "не менять"; `null` = "очистить". Эта семантика совпадает с PATCH-семантикой бэка.
export interface ProfilePatch {
	email?: string
	displayName?: string | null
	phone?: string | null
	avatarUrl?: string | null
}

export function register(creds: Credentials): Promise<{user: AuthUser}> {
	return apiFetch<{user: AuthUser}>('/auth/register', {method: 'POST', body: JSON.stringify(creds)})
}

export function login(creds: Credentials): Promise<{user: AuthUser}> {
	return apiFetch<{user: AuthUser}>('/auth/login', {method: 'POST', body: JSON.stringify(creds)})
}

export function logout(): Promise<void> {
	return apiFetch<void>('/auth/logout', {method: 'POST'})
}

export function fetchMe(): Promise<{user: AuthUser}> {
	return apiFetch<{user: AuthUser}>('/auth/me')
}

export function updateProfile(patch: ProfilePatch): Promise<{user: AuthUser}> {
	return apiFetch<{user: AuthUser}>('/auth/me', {method: 'PATCH', body: JSON.stringify(patch)})
}

export function changePassword(currentPassword: string, newPassword: string): Promise<void> {
	return apiFetch<void>('/auth/password', {
		method: 'POST',
		body: JSON.stringify({currentPassword, newPassword}),
	})
}
