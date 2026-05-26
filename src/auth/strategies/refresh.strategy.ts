import { Inject, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { TailUserForToken } from '../../user/user.types';
import { Request } from 'express';
import { AuthService } from '../auth.service';

@Injectable()
export class RefreshJwtStrategy extends PassportStrategy(
	Strategy,
	'refresh-jwt',
) {
	constructor(
		private readonly configService: ConfigService,
		private authService: AuthService,
	) {
		super({
			jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
			secretOrKey: configService.get('REFRESH_JWT_SECRET'),
			ignoreExpiration: false,
			passReqToCallback: true,
		});
	}

	async validate(req: Request, payload: TailUserForToken) {
		const refreshToken = req.get('authorization').replace('Bearer', '').trim();

		const userId = payload.id;
		
		return await this.authService.validateRefreshToken(userId, refreshToken);
		// return { id: payload.id, email: payload.email };
	}
}
