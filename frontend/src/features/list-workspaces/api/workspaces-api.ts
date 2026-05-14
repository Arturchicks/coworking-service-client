import {apiFetch} from '../../../shared/api'
import type {Workspace} from '../../../entities/workspace'


export function fetchAllWorkspaces(): Promise<Workspace[]> {
	return apiFetch<Workspace[]>('/workspaces')
}

export function fetchAvailableWorkspaces(startsAt: string, endsAt: string): Promise<Workspace[]> {
	return apiFetch<Workspace[]>('/workspaces/available', {query: {startsAt, endsAt}})
}
