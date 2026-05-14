import {API_BASE_URL} from '../config'


export class ApiError extends Error {
	constructor(public readonly status: number, public readonly path: string, public readonly body?: unknown) {
		super(`API error ${status}: ${path}`)
	}
}

interface FetchOptions extends RequestInit {
	query?: Record<string, string | undefined>
}

function buildUrl(path: string, query?: Record<string, string | undefined>): string {
	const url = new URL(`${API_BASE_URL}${path}`, window.location.origin)
	if (query) {
		for (const [k, v] of Object.entries(query)) {
			if (v !== undefined) url.searchParams.set(k, v)
		}
	}
	return url.toString()
}

export async function apiFetch<T>(path: string, init?: FetchOptions): Promise<T> {
	const {query, ...rest} = init ?? {}
	const res = await fetch(buildUrl(path, query), {
		headers: {'Content-Type': 'application/json', ...rest?.headers},
		credentials: 'include',
		...rest,
	})

	if (!res.ok) {
		let body: unknown = undefined
		try {
			body = await res.json()
		} catch {
			// body not JSON — игнорируем
		}
		throw new ApiError(res.status, path, body)
	}

	if (res.status === 204) return undefined as T
	return res.json() as Promise<T>
}
