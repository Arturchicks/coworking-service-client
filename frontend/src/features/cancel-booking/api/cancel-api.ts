import {apiFetch} from '../../../shared/api'
import type {Booking} from '../../../entities/booking'


// userEmail в body больше не нужен — backend берёт userId из cookie.
export function cancelBooking(bookingId: string): Promise<Booking> {
	return apiFetch<Booking>(`/bookings/${bookingId}/cancel`, {method: 'POST'})
}
