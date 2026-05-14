import {apiFetch} from '../../../shared/api'
import type {Booking} from '../../../entities/booking'


export interface CreateBookingInput {
	workspaceId: string
	startsAt: string
	endsAt: string
}

export function createBooking(input: CreateBookingInput): Promise<Booking> {
	return apiFetch<Booking>('/bookings', {
		method: 'POST',
		body: JSON.stringify(input),
	})
}
