import {BookingNotFoundError, BookingRepository} from '../../domain/bookings/BookingRepository'
import {BookingDto, bookingToDto} from './dto/BookingDto'


export class BookingForbiddenError extends Error {
	constructor() {
		super('Booking does not belong to the requesting user')
		this.name = 'BookingForbiddenError'
	}
}

export interface CancelBookingInput {
	bookingId: string
	userId: string
}

export class CancelBookingUseCase {
	constructor(private readonly bookings: BookingRepository) {}

	async execute(input: CancelBookingInput): Promise<BookingDto> {
		const booking = await this.bookings.findById(input.bookingId)
		if (!booking) throw new BookingNotFoundError(input.bookingId)

		if (booking.userId !== input.userId) throw new BookingForbiddenError()

		booking.cancel()
		await this.bookings.save(booking)
		return bookingToDto(booking)
	}
}
