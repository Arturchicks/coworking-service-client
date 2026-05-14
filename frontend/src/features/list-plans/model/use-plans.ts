import {useEffect, useState} from 'react'
import type {Plan} from '../../../entities/plan'
import {fetchPlans} from '../api/plans-api'


export function usePlans() {
	const [plans, setPlans] = useState<Plan[]>([])
	const [loading, setLoading] = useState(true)
	const [error, setError] = useState<string | null>(null)

	useEffect(() => {
		fetchPlans()
			.then(setPlans)
			.catch((e) => setError(e instanceof Error ? e.message : 'unknown error'))
			.finally(() => setLoading(false))
	}, [])

	return {plans, loading, error}
}
