import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { User } from '../entities/user.entity';
import { USER_NOT_FOUND } from './user.constants';
import { UpdateUserDto } from './dto/update-user.dto';
import { PaginationParamsDto } from '../device/dto/pagination-params.dto';

@Injectable()
export class UserService {
	constructor(@Inject('USER_REPOSITORY') private userRepository: typeof User) {}

	async findById(id: string) {
		return await this.userRepository.findOne({
			where: { id },
			include: ['devices'],
			attributes: [
				'id',
				'email',
				'subscription',
				'role',
				'stripeCustomerId',
				'subscriptionId',
				'referralCode',
				'referredById',
				'createdAt',
			],
		});
	}

	async getAll({ limit, page }: PaginationParamsDto) {
		const currentPage = Number(page) || 1;
		const collectionLimit = Number(limit) || 10;
		const offset = (Number(currentPage) - 1) * Number(collectionLimit);

		return await this.userRepository.findAndCountAll({
			attributes: [
				'id',
				'email',
				'subscription',
				'role',
				'referralCode',
				'createdAt',
			],
			order: [['createdAt', 'DESC']],
			limit: collectionLimit,
			offset,
		});
	}

	async getOne(id: string) {
		const user = await this.findById(id);
		if (!user) {
			throw new NotFoundException(USER_NOT_FOUND);
		}

		return user;
	}

	async updateOne(id: string, dto: UpdateUserDto) {
		let user = await this.findById(id);

		if (!user) {
			throw new NotFoundException(USER_NOT_FOUND);
		}

		await user.update({ ...dto });
		return user;
	}

	async deleteOne(id: string) {
		let user = await this.findById(id);

		if (!user) {
			throw new NotFoundException(USER_NOT_FOUND);
		}

		await user.destroy();
		return {
			statusCode: 200,
			message: `The user ${id} was deleted`,
		};
	}
}
