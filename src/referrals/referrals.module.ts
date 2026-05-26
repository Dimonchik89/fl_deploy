import { Module } from '@nestjs/common';
import { referralsProviders } from './referrals.providers';
import { ReferralsController } from './referrals.controller';
import { ReferralsService } from './referrals.service';
import { userProviders } from '../user/user.providers';

@Module({
	controllers: [ReferralsController],
	providers: [ReferralsService, ...referralsProviders, ...userProviders],
})
export class ReferralsModule {}
