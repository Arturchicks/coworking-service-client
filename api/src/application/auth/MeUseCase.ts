import {UserRepository} from '../../domain/users/UserRepository'
import type {UserProfile} from '../../domain/users/User'


// Возвращает public-projection с profile-полями.
// Тип = `User.toPublic()` без дублирования (Single Source of Truth).
export type MePublic = {id: string; email: string; createdAt: string} & UserProfile

export class MeUseCase {
	constructor(private readonly users: UserRepository) {}

	async execute(userId: string): Promise<MePublic | null> {
		const user = await this.users.findById(userId)
		return user ? user.toPublic() : null
	}
}
