import { Referrals } from '../entities/referrals.entity';

export const referralsProviders = [
	{
		provide: 'REFERRALS_REPOSITORY',
		useValue: Referrals,
	},
];
