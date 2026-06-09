import {
	Inject,
	Injectable,
	NotFoundException,
	BadRequestException,
	Logger,
} from '@nestjs/common';
import { CreateReferralDto } from './dto/create-referral.dto';
import { Referrals } from '../entities/referrals.entity';
import { User } from '../entities/user.entity';

@Injectable()
export class ReferralsService {
	private readonly logger = new Logger(ReferralsService.name);

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

		// Prevent self-referral
		if (referrerUser.id === dto.refereeId) {
			throw new BadRequestException('You cannot refer yourself.');
		}

		const refereeUser = await this.userRepository.findOne({
			where: { id: dto.refereeId },
		});

		if (!refereeUser) {
			throw new NotFoundException('User with this id was not found');
		}

		// Check if referral already exists to prevent unique constraint errors (500)
		const existingReferral = await this.referralsRepository.findOne({
			where: { refereeId: dto.refereeId },
		});

		if (existingReferral) {
			this.logger.log(`Referral for user ${dto.refereeId} already exists.`);
			return { success: true, message: 'Already referred' };
		}

		await this.referralsRepository.create({
			referrerId: referrerUser.id,
			refereeId: dto.refereeId,
			status: 'pending',
		});

		this.logger.log(
			`Referral created: ${referrerUser.id} invited ${dto.refereeId}`,
		);

		return { success: true };
	}
}
