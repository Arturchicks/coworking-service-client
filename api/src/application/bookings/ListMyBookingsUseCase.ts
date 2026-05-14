import {BookingRepository} from '../../domain/bookings/BookingRepository'
import {BookingDto, bookingToDto} from './dto/BookingDto'


export class ListMyBookingsUseCase {
	constructor(private readonly bookings: BookingRepository) {}

	async execute(userId: string): Promise<BookingDto[]> {
		const list = await this.bookings.findByUserId(userId)
		return list.map(bookingToDto)
	}
}
