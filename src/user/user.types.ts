import { User } from '../entities/user.entity';

export type TailUserForToken = Pick<
	User,
	'id' | 'email' | 'subscription' | 'stripeCustomerId' | 'role'
>;

export interface UserAccessToken {
	access_token: string;
}
export interface UserAccessTokenAndRefreshToken {
	access_token: string;
	refresh_token: string;
}
