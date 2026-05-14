import {useCallback, useEffect, useState} from 'react'
import type {Workspace} from '../../../entities/workspace'
import {fetchAllWorkspaces, fetchAvailableWorkspaces} from '../api/workspaces-api'


interface WorkspacesState {
	workspaces: Workspace[]
	loading: boolean
	error: string | null
	filter: {startsAt: string; endsAt: string} | null
	loadAll: () => Promise<void>
	loadAvailable: (startsAt: string, endsAt: string) => Promise<void>
}

export function useWorkspaces(): WorkspacesState {
	const [workspaces, setWorkspaces] = useState<Workspace[]>([])
	const [loading, setLoading] = useState(false)
	const [error, setError] = useState<string | null>(null)
	const [filter, setFilter] = useState<{startsAt: string; endsAt: string} | null>(null)

	const loadAll = useCallback(async () => {
		setLoading(true)
		setError(null)
		try {
			const data = await fetchAllWorkspaces()
			setWorkspaces(data)
			setFilter(null)
		} catch (e) {
			setError(e instanceof Error ? e.message : 'unknown error')
		} finally {
			setLoading(false)
		}
	}, [])

	const loadAvailable = useCallback(async (startsAt: string, endsAt: string) => {
		setLoading(true)
		setError(null)
		try {
			const data = await fetchAvailableWorkspaces(startsAt, endsAt)
			setWorkspaces(data)
			setFilter({startsAt, endsAt})
		} catch (e) {
			setError(e instanceof Error ? e.message : 'unknown error')
		} finally {
			setLoading(false)
		}
	}, [])

	useEffect(() => {
		void loadAll()
	}, [loadAll])

	return {workspaces, loading, error, filter, loadAll, loadAvailable}
}
