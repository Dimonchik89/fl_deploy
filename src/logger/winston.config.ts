import * as winston from 'winston';
import { utilities as nestWinstonModuleUtilities } from 'nest-winston';

export const winstonConfig = {
	transports: [
		new winston.transports.Console({
			format: winston.format.combine(
				winston.format.timestamp(),
				winston.format.ms(),
				process.env.NODE_ENV === 'production'
					? winston.format.json()
					: nestWinstonModuleUtilities.format.nestLike('FlStudio', {
							colors: true,
							prettyPrint: true,
						}),
			),
		}),
		// Вы можете добавить файловые транспорты для продакшена
		...(process.env.NODE_ENV === 'production'
			? [
					new winston.transports.File({
						filename: 'logs/error.log',
						level: 'error',
						format: winston.format.combine(
							winston.format.timestamp(),
							winston.format.json(),
						),
					}),
					new winston.transports.File({
						filename: 'logs/combined.log',
						format: winston.format.combine(
							winston.format.timestamp(),
							winston.format.json(),
						),
					}),
				]
			: []),
	],
};
