import { Inject, Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-google-oauth20';
import googleOathConfig from '../config/google-oath.config';
import { ConfigType } from '@nestjs/config';
import { VerifiedCallback } from 'passport-jwt';
import { AuthService } from '../auth.service';

@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy) {
	constructor(
		@Inject(googleOathConfig.KEY)
		private googleConfiguration: ConfigType<typeof googleOathConfig>,
		private authService: AuthService,
	) {
		super({
			clientID: googleConfiguration.clientId,
			clientSecret: googleConfiguration.clientSecret,
			callbackURL: googleConfiguration.callbackURL,
			scope: ['email', 'profile'],
		});
	}

	async validate(
		accessToken: string,
		refreshToken: string,
		profile: any,
		done: VerifiedCallback,
	) {
		const user = await this.authService.validateGoogleUser({
			login: profile.emails[0].value,
			password: '',
		});

		const tailUser = {
			id: user.id,
			email: user.email,
			subscription: user.subscription,
			stripeCustomerId: user.stripeCustomerId,
			role: user.role,
		};

		done(null, tailUser);
		// return user;
	}
}
