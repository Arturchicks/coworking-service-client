import {apiFetch} from '../../../shared/api'
import type {Booking} from '../../../entities/booking'


// userId/email больше не нужен — backend берёт его из cookie session.
export function fetchMyBookings(): Promise<Booking[]> {
	return apiFetch<Booking[]>('/bookings/mine')
}
