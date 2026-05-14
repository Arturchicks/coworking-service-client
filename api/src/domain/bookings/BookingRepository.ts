import {Booking} from './Booking'


export class BookingOverlapError extends Error {
	constructor(workspaceId: string) {
		super(`Booking overlap: workspace ${workspaceId} already booked for this interval`)
		this.name = 'BookingOverlapError'
	}
}

export class BookingNotFoundError extends Error {
	constructor(id: string) {
		super(`Booking not found: ${id}`)
		this.name = 'BookingNotFoundError'
	}
}

export interface BookingRepository {
	save(booking: Booking): Promise<void>
	findById(id: string): Promise<Booking | null>
	findByUserId(userId: string): Promise<Booking[]>
}
