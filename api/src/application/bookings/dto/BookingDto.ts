import {Booking, BookingStatus} from '../../../domain/bookings/Booking'


export interface BookingDto {
	id: string
	workspaceId: string
	userId: string
	startsAt: string
	endsAt: string
	totalPrice: {amountMinor: number; currency: string}
	status: BookingStatus
	createdAt: string
}

export function bookingToDto(b: Booking): BookingDto {
	return {
		id: b.id,
		workspaceId: b.workspaceId,
		userId: b.userId,
		startsAt: b.range.startsAt.toISOString(),
		endsAt: b.range.endsAt.toISOString(),
		totalPrice: b.totalPrice.toJSON(),
		status: b.status,
		createdAt: b.createdAt.toISOString(),
	}
}
