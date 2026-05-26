import { Module, forwardRef } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { ConfigModule } from '@nestjs/config';
import { PassportModule } from '@nestjs/passport';
import { JwtStrategy } from './strategies/jwt.strategy';
import { userProviders } from '../user/user.providers';
import { JwtModule } from '@nestjs/jwt';
import jwtConfig from './config/jwt.config';
import refreshJwtConfig from './config/refresh-jwt-config';
import { RefreshJwtStrategy } from './strategies/refresh.strategy';
import googleOathConfig from './config/google-oath.config';
import { GoogleStrategy } from './strategies/google.strategy';
import clientConfig from './config/client.config';
import { StripeModule } from '../stripe/stripe.module';
import { referralsProviders } from '../referrals/referrals.providers';

@Module({
	controllers: [AuthController],
	imports: [
		ConfigModule,
		JwtModule.registerAsync(jwtConfig.asProvider()),
		ConfigModule.forFeature(jwtConfig),
		ConfigModule.forFeature(refreshJwtConfig),
		ConfigModule.forFeature(googleOathConfig),
		ConfigModule.forFeature(clientConfig),
		PassportModule,
		forwardRef(() => StripeModule),
	],
	providers: [
		AuthService,
		JwtStrategy,
		RefreshJwtStrategy,
		GoogleStrategy,
		// Если нужно добавить @UseGuard() во все ендпоинты и не добавлять в каждый вручну.
		// {
		// 	provide: APP_GUARD,
		// 	useClass: JwtAuthGuard // @UseGuard(JwtAuthGuard) будет добавлено во все ендпоинты
		// },
		// {
		// 	provide: APP_GUARD,
		// 	useClass: RolesGuard
		// },
		...userProviders,
		...referralsProviders,
	],
	exports: [AuthService],
})
export class AuthModule {}
