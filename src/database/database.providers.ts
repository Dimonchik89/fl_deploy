import { Sequelize } from 'sequelize-typescript';
import { User } from '../entities/user.entity';
// import { File } from '../entities/file.entity';
import { Post } from '../entities/post.entity';
import { Referrals } from '../entities/referrals.entity';

// ----------------------------------------- DEV MODE
// export const databaseProviders = [
// 	{
// 		provide: 'SEQUELIZE',
// 		useFactory: async () => {
// 			const sequelize = new Sequelize({
// 				dialect: 'postgres',
// 				host: process.env.POSTGRES_HOST,
// 				port: Number(process.env.POSTGRES_PORT),
// 				username: process.env.POSTGRES_USER,
// 				password: process.env.POSTGRES_PASSWORD,
// 				database: process.env.POSTGRES_DB,
// 				// dialectOptions: {
// 				// 	ssl: {
// 				// 		require: true,
// 				// 		rejectUnauthorized: false,
// 				// 	},
// 				// },
// 				logging: false,
// 			});
// 			sequelize.addModels([User, Post, Referrals]);
// 			// sequelize.addModels([__dirname + '../**/*.entity{.ts,.js}']); work with typeorm
// 			await sequelize.sync();
// 			return sequelize;
// 		},
// 	},
// ];

// --------------------------------------- PROD MODE
export const databaseProviders = [
	{
		provide: 'SEQUELIZE',
		useFactory: async () => {
			const sequelize = new Sequelize({
				dialect: 'postgres',
				host: process.env.POSTGRES_HOST,
				port: Number(process.env.POSTGRES_PORT),
				username: process.env.POSTGRES_USER,
				password: process.env.POSTGRES_PASSWORD,
				database: process.env.POSTGRES_DB,
				dialectOptions:
					process.env.NODE_ENV === 'production'
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
			sequelize.addModels([User, Post, Referrals]);
			// sequelize.addModels([__dirname + '../**/*.entity{.ts,.js}']); work with typeorm
			await sequelize.authenticate();
			return sequelize;
		},
	},
];
