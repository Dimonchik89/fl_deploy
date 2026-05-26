import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { json } from 'express';
import * as bodyParser from 'body-parser';
import { promises as fsPromises } from 'fs';
import { ValidationPipe } from '@nestjs/common';

async function bootstrap() {
	const app = await NestFactory.create(AppModule, { rawBody: true });
	// app.enableCors({
	// 	origin: process.env.BASE_CLIENT_URL,
	// });

	app.enableCors();
	app.setGlobalPrefix('api');
	// проверка соотвецтвие входящих с клиента данных во всем проекте
	// app.useGlobalPipes(
	// 	new ValidationPipe({
	// 		whitelist: true,
	// 		forbidNonWhitelisted: true,
	// 	}),
	// );

	const options = new DocumentBuilder()
		.setTitle('Fl studio API')
		.setDescription('Documentation for Fl studio API')
		.setVersion('1.0')
		.addBearerAuth(
			{
				description: `Please enter token in following format: Bearer <JWT>`,
				name: 'Authorization',
				bearerFormat: 'Bearer',
				scheme: 'Bearer',
				type: 'http',
				in: 'Header',
			},
			'access_token',
		)
		.addBearerAuth(
			{
				description: `Refresh token: Bearer <JWT>`,
				name: 'Authorization',
				bearerFormat: 'Bearer',
				scheme: 'Bearer',
				type: 'http',
				in: 'Header',
			},
			'refresh_token',
		)
		.build();

	const document = SwaggerModule.createDocument(app, options);

	await fsPromises.writeFile(
		'./swagger-spec.json',
		JSON.stringify(document, null, 2),
	);

	SwaggerModule.setup('api/swagger', app, document);

	await app.listen(process.env.PORT ?? 3001);
}
bootstrap();

// stripe login - если ошибка перелогинится

// stripe listen --forward-to localhost:3001/api/stripe/webhook
