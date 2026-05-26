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
import { UserModule } from './user/user.module';
import { ReferralsModule } from './referrals/referrals.module';
import { MailerModule } from '@nestjs-modules/mailer';
import { HandlebarsAdapter } from '@nestjs-modules/mailer/dist/adapters/handlebars.adapter';

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
			rootPath: join(__dirname, '..', '..', 'uploads'),
			serveRoot: '/uploads',
		}),
		ConfigModule.forRoot({
			isGlobal: true,
		}),
		MailerModule.forRootAsync({
			useFactory: () => ({
				transport: {
					host: process.env.MAIL_HOST,
					port: process.env.MAIL_PORT,
					secure: process.env.MAIL_SECURE,
					auth: {
						user: process.env.MAIL_USER,
						pass: process.env.MAIL_PASSWORD,
					},
					tls: {
						rejectUnauthorized: true,
					},
					defaults: {
						from: process.env.MAIL_FROM,
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
	],
})
export class AppModule {}
