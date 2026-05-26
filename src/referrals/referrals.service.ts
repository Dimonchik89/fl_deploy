import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { CreateReferralDto } from './dto/create-referral.dto';
import { Referrals } from '../entities/referrals.entity';
import { User } from '../entities/user.entity';

@Injectable()
export class ReferralsService {
	constructor(
		@Inject('REFERRALS_REPOSITORY')
		private referralsRepository: typeof Referrals,
		@Inject('USER_REPOSITORY') private userRepository: typeof User,
	) {}

	async createReferral(dto: CreateReferralDto) {
		const referrerUser = await this.userRepository.findOne({
			where: { referralCode: dto.referral },
		});

		if (!referrerUser) {
			throw new NotFoundException('No user with this referral link was found.');
		}

		const refereeUser = await this.userRepository.findOne({
			where: { id: dto.refereeId },
		});

		if (!refereeUser) {
			throw new NotFoundException('User with this id was not found');
		}

		const referrer = await this.referralsRepository.create({
			referrerId: referrerUser.id,
			refereeId: dto.refereeId,
			status: 'pending',
		});

		return { success: true };
	}
}
