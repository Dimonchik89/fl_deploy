import { Module } from '@nestjs/common';
import { AuthModule } from './auth/auth.module';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { StripeModule } from './stripe/stripe.module';
import { DatabaseModule } from './database/database.module';
import { PostsModule } from './posts/posts.module';
import jwtConfig from './auth/config/jwt.config';
import { ServeStaticModule } from '@nestjs/serve-static';
import { join } from 'path';
import { path as appRootPath } from 'app-root-path';
import { UserModule } from './user/user.module';
import { ReferralsModule } from './referrals/referrals.module';
import { MailerModule } from '@nestjs-modules/mailer';
import { HandlebarsAdapter } from '@nestjs-modules/mailer/dist/adapters/handlebars.adapter';
import { envValidationSchema } from './config/env.validation';
import { DeviceModule } from './device/device.module';

@Module({
	imports: [
		// JwtModule.register({
		// 	global: true,
		// 	secret: process.env.JWT_SECRET,
		// 	signOptions: { expiresIn: process.env.JWT_EXPIRE_IN },
		// }),
		// JwtModule.registerAsync(jwtConfig.asProvider()),
		// JwtModule.registerAsync(jwtConfig.asProvider()),
		ServeStaticModule.forRoot({
			rootPath: join(appRootPath, 'uploads'),
			serveRoot: '/uploads',
		}),
		ConfigModule.forRoot({
			isGlobal: true,
			validationSchema: envValidationSchema,
			validationOptions: {
				allowUnknown: true,
				abortEarly: true,
			},
		}),
		MailerModule.forRootAsync({
			inject: [ConfigService],
			useFactory: (configService: ConfigService) => ({
				transport: {
					host: configService.get('MAIL_HOST'),
					port: configService.get('MAIL_PORT'),
					secure: configService.get('MAIL_SECURE'),
					auth: {
						user: configService.get('MAIL_USER'),
						pass: configService.get('MAIL_PASSWORD'),
					},
					tls: {
						rejectUnauthorized: true,
					},
					defaults: {
						from: configService.get('MAIL_FROM'),
					},
					// template: {
					//     dir: join(__dirname, 'templates'),
					//     adapter: new HandlebarsAdapter(),
					//     options: {
					//         strict: true,
					//     },
					// },
				},
			}),
		}),
		AuthModule,
		StripeModule,
		DatabaseModule,
		PostsModule,
		UserModule,
		ReferralsModule,
		DeviceModule,
	],
})
export class AppModule {}
