import * as Joi from 'joi';

export const envValidationSchema = Joi.object({
	NODE_ENV: Joi.string()
		.valid('development', 'production', 'test', 'provision')
		.default('development'),
	PORT: Joi.number().port().default(3001),

	// Database
	POSTGRES_HOST: Joi.string().required(),
	POSTGRES_PORT: Joi.number().port().required(),
	POSTGRES_USER: Joi.string().required(),
	POSTGRES_PASSWORD: Joi.string().required(),
	POSTGRES_DB: Joi.string().required(),

	// JWT
	JWT_SECRET: Joi.string().required(),
	JWT_EXPIRE_IN: Joi.string().required(),
	REFRESH_JWT_SECRET: Joi.string().required(),
	REFRESH_JWT_EXPIRE_IN: Joi.string().required(),

	// Mail
	MAIL_HOST: Joi.string().required(),
	MAIL_PORT: Joi.number().port().required(),
	MAIL_SECURE: Joi.boolean().required(),
	MAIL_USER: Joi.string().required(),
	MAIL_PASSWORD: Joi.string().required(),
	MAIL_FROM: Joi.string().required(),

	// Stripe
	STRIPE_SECRET_KEY: Joi.string().required(),
	STRIPE_WEBHOOK_SECRET_KEY: Joi.string().required(),

	// Client
	CLIENT_URL: Joi.string().uri().required(),
	BASE_CLIENT_URL: Joi.string().uri().required(),

	// Google OAuth (Optional or Required depending on your setup)
	GOOGLE_CLIENT_ID: Joi.string().optional(),
	GOOGLE_SECRET: Joi.string().optional(),
	GOOGLE_CALLBACK_URL: Joi.string().uri().optional(),

	// Uploads
	UPLOADS_BASE_PATH: Joi.string().default('uploads'),
});
