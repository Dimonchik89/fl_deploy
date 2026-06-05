import { Sequelize } from 'sequelize-typescript';
import { User } from '../entities/user.entity';
import { Post } from '../entities/post.entity';
import { Referrals } from '../entities/referrals.entity';
import { ConfigService } from '@nestjs/config';
import { Device } from '../entities/device.entity';
import { AuthCode } from '../entities/auth-code.entity';

export const databaseProviders = [
	{
		provide: 'SEQUELIZE',
		inject: [ConfigService],
		useFactory: async (configService: ConfigService) => {
			const sequelize = new Sequelize({
				dialect: 'postgres',
				host: configService.get<string>('POSTGRES_HOST'),
				port: configService.get<number>('POSTGRES_PORT'),
				username: configService.get<string>('POSTGRES_USER'),
				password: configService.get<string>('POSTGRES_PASSWORD'),
				database: configService.get<string>('POSTGRES_DB'),
				dialectOptions:
					configService.get<string>('NODE_ENV') === 'production'
						? {
								ssl: {
									require: true,
									rejectUnauthorized: false,
								},
								statement_timeout: 10000,
								idle_in_transaction_session_timeout: 20000,
							}
						: {},
				pool: {
					max: 20,
					min: 0,
					acquire: 30000,
					idle: 10000,
				},

				retry: {
					max: 3,
				},
				logging: false,
			});
			sequelize.addModels([User, Post, Referrals, Device, AuthCode]);
			await sequelize.authenticate();
			return sequelize;
		},
	},
];
