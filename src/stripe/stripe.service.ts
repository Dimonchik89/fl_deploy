// -------------------------------------- Test combination

import {
	BadRequestException,
	Inject,
	Injectable,
	UnauthorizedException,
	forwardRef,
} from '@nestjs/common';
import Stripe from 'stripe';
import { JwtService } from '@nestjs/jwt';
import {
	INVALID_TOKEN_ERROR,
	UNAUTHORIZED_ERROR,
} from '../auth/auth.constants';
import {
	CheckoutSession,
	ResponseWithURL,
	StripePrice,
	StripeProduct,
	SubscriptionEnum,
} from './stripe.types';
import {
	TailUserForToken,
	UserAccessToken,
	UserAccessTokenAndRefreshToken,
} from '../user/user.types';
import { CUSTOMER_NOT_FOUND_ERROR } from './stripe.constants';
import { User } from '../entities/user.entity';
import { StripeWebhookService } from './stripe-webhook.service';
import { AuthService } from 'src/auth/auth.service';
import { Role } from 'src/auth/enums/role.enum';

@Injectable()
export class StripeService {
	private stripe;

	constructor(
		@Inject('USER_REPOSITORY') private userRepository: typeof User,
		private jwtService: JwtService,
		private readonly stripeWebhookService: StripeWebhookService,
		// private readonly authService: AuthService,
		@Inject(forwardRef(() => AuthService))
		private readonly authService: AuthService,
	) {
		this.stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
			apiVersion: '2025-02-24.acacia',
		});
	}

	async getPricesAndProducts(): Promise<StripePrice[]> {
		const products: Stripe.ApiList<StripePrice> = await this.stripe.prices.list(
			{
				expand: ['data.product'],
			},
		);
		return products.data;
	}

	async checkout(priceId: string, userId: string): Promise<{ url: string }> {
		// if (!price) {
		// 	throw new BadRequestException('Product not found');
		// }

		// const user = await this.userRepository.findOne({
		// 	where: { id: userId },
		// });
		// if (!user) {
		//     throw new UnauthorizedException('User not found');
		// }

		// // Используем customerId, если он есть, чтобы не создавать дубликаты
		// const customerId = user.stripeCustomerId || (await this.createStripeCustomer(user.email));
		// user.stripeCustomerId = customerId;
		// await user.save();

		// const session: Stripe.Checkout.Session = await this.stripe.checkout.sessions.create({
		//     line_items: [{ price, quantity: 1 }],
		//     mode: 'subscription',
		//     customer: customerId, // Передаём customerId
		//     success_url: `${process.env.BASE_CLIENT_URL}/profile?session_id={CHECKOUT_SESSION_ID}`,
		//     cancel_url: `${process.env.BASE_CLIENT_URL}/profile`,
		// });

		// return { url: session.url };

		const user = await this.userRepository.findByPk(userId);
		if (!user) {
			throw new BadRequestException('User not found');
		}

		const price = await this.stripe.prices.retrieve(priceId);
		if (!price || !price.active) {
			throw new BadRequestException('No such price exists');
		}

		// const subscriptionIdToCancel = user.subscriptionId;
		const customerId =
			user.stripeCustomerId || (await this.createStripeCustomer(user.email));
		user.stripeCustomerId = customerId;
		await user.save();

		const session = await this.stripe.checkout.sessions.create({
			mode: 'subscription',
			line_items: [{ price: price.id, quantity: 1 }],
			success_url: `${process.env.BASE_CLIENT_URL}/profile?session_id={CHECKOUT_SESSION_ID}`,
			cancel_url: `${process.env.BASE_CLIENT_URL}/profile`,
			customer: user.stripeCustomerId, // Передаём customerId, чтобы Stripe понимал, что это существующий клиент
		});

		return { url: session.url };
	}

	async createStripeCustomer(email: string): Promise<string> {
		const customer = await this.stripe.customers.create({ email });
		return customer.id;
	}

	async success(
		session_id: string,
		userId: string,
	): Promise<UserAccessTokenAndRefreshToken> {
		if (!userId) {
			throw new UnauthorizedException(INVALID_TOKEN_ERROR);
		}

		const user = await this.userRepository.findOne({
			where: { id: userId },
		});

		if (!user) {
			throw new UnauthorizedException('User not found');
		}

		try {
			await this.stripe.checkout.sessions.retrieve(session_id, {
				extend: ['subscription', 'subscription.plan.product'],
			});
		} catch (error) {
			throw new BadRequestException('No such checkout session');
		}

		const tailUser: TailUserForToken = {
			id: user.id,
			email: user.email,
			subscription: user.subscription,
			stripeCustomerId: user.stripeCustomerId,
			role: Role.USER,
		};

		const { accessToken, refreshToken } =
			await this.authService.generateTokens(tailUser);

		await this.authService.updateHashedRefreshToken(userId, refreshToken);

		return {
			access_token: accessToken,
			refresh_token: refreshToken,
		};
	}

	async customerInfo(
		customerId: string,
		userId: string,
	): Promise<ResponseWithURL> {
		const user = await this.userRepository.findOne({
			where: { id: userId },
		});

		if (!user) {
			throw new UnauthorizedException('User not found');
		}

		if (user.stripeCustomerId !== customerId) {
			throw new BadRequestException(CUSTOMER_NOT_FOUND_ERROR);
		}

		const portalSession = await this.stripe.billingPortal.sessions.create({
			customer: customerId,
			return_url: `${process.env.BASE_CLIENT_URL}/profile`,
		});

		return { url: portalSession.url };
	}

	async webhook(
		payload: Buffer,
		signature: string,
	): Promise<{ received: boolean }> {
		let event: Stripe.Event;
		const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET_KEY;

		try {
			event = await this.stripe.webhooks.constructEvent(
				payload,
				signature,
				endpointSecret,
			);
		} catch (err) {
			throw new BadRequestException(`Webhook error: ${err.message}`);
		}
		return this.stripeWebhookService.handleWebhook(event);
	}
}
