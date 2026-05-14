import {useCallback, useEffect, useState} from 'react'
import type {Subscription} from '../../../entities/subscription'
import {useAuth} from '../../auth'
import {fetchMySubscriptions} from '../api/my-subs-api'


export function useMySubscriptions() {
	const {user} = useAuth()
	const [subs, setSubs] = useState<Subscription[]>([])
	const [loading, setLoading] = useState(false)
	const [error, setError] = useState<string | null>(null)

	const reload = useCallback(async () => {
		if (!user) return
		setLoading(true)
		setError(null)
		try {
			setSubs(await fetchMySubscriptions())
		} catch (e) {
			setError(e instanceof Error ? e.message : 'unknown error')
		} finally {
			setLoading(false)
		}
	}, [user])

	useEffect(() => {
		reload()
	}, [reload])

	return {subs, loading, error, reload}
}
