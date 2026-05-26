import { Inject, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { TailUserForToken } from '../../user/user.types';
// import { jwtConstants } from '../auth.constants';
// import { jwtConstants } from '../config/jwt.config';

// @Injectable()
// export class JwtStrategy extends PassportStrategy(Strategy) {
// 	constructor() {
// 		super({
// 			jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
// 			ignoreExpiration: true,
// 			// secretOrKey: configService.get("JWT_SECRET")
// 			secretOrKey: process.env.JWT_SECRET,
// 		});
// 	}

// 	async validate({ email }: { email: string }) {
// 		return email;
// 	}
// }

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
	constructor(private readonly configService: ConfigService) {
		super({
			jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
			secretOrKey: configService.get('JWT_SECRET'),
			ignoreExpiration: false,
		});
	}

	async validate(payload: TailUserForToken) {
		return { id: payload.id, email: payload.email, role: payload.role };
	}
}
