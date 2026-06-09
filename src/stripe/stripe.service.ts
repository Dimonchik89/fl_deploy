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
		try {
			const products: Stripe.ApiList<StripePrice> =
				await this.stripe.prices.list({
					expand: ['data.product'],
				});
			return products.data;
		} catch (error) {
			throw new BadRequestException(`Stripe error: ${error.message}`);
		}
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

		let price;
		try {
			price = await this.stripe.prices.retrieve(priceId);
		} catch (error) {
			throw new BadRequestException(`Stripe price error: ${error.message}`);
		}

		if (!price || !price.active) {
			throw new BadRequestException('No such price exists');
		}

		// const subscriptionIdToCancel = user.subscriptionId;
		const customerId =
			user.stripeCustomerId || (await this.createStripeCustomer(user.email));
		user.stripeCustomerId = customerId;
		await user.save();

		try {
			const session = await this.stripe.checkout.sessions.create(
				{
					mode: 'subscription',
					line_items: [{ price: price.id, quantity: 1 }],
					success_url: `${process.env.BASE_CLIENT_URL}/profile?session_id={CHECKOUT_SESSION_ID}`,
					cancel_url: `${process.env.BASE_CLIENT_URL}/profile`,
					customer: user.stripeCustomerId,
				},
				{
					idempotencyKey: `checkout-${userId}-${priceId}`,
				},
			);

			return { url: session.url };
		} catch (error) {
			throw new BadRequestException(`Stripe checkout error: ${error.message}`);
		}
	}

	async createStripeCustomer(email: string): Promise<string> {
		try {
			const customer = await this.stripe.customers.create({ email });
			return customer.id;
		} catch (error) {
			throw new BadRequestException(`Stripe customer error: ${error.message}`);
		}
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

		let session: Stripe.Checkout.Session;
		try {
			session = await this.stripe.checkout.sessions.retrieve(session_id, {
				expand: ['subscription', 'subscription.plan.product'],
			});
		} catch (error) {
			throw new BadRequestException(`Stripe session error: ${error.message}`);
		}

		if (session.customer !== user.stripeCustomerId) {
			throw new UnauthorizedException('This session does not belong to you');
		}

		if (session.payment_status !== 'paid') {
			throw new BadRequestException('Payment not confirmed');
		}

		// Update user if not already updated by webhook
		const subscription = session.subscription as Stripe.Subscription;
		const product = subscription.items.data[0].price.product as Stripe.Product;

		if (user.subscription !== product.name) {
			user.subscription = product.name as SubscriptionEnum;
			user.subscriptionId = subscription.id;
			await user.save();
		}

		const tailUser: TailUserForToken = {
			id: user.id,
			email: user.email,
			subscription: user.subscription,
			stripeCustomerId: user.stripeCustomerId,
			role: user.role,
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

		try {
			const portalSession = await this.stripe.billingPortal.sessions.create({
				customer: customerId,
				return_url: `${process.env.BASE_CLIENT_URL}/profile`,
			});

			return { url: portalSession.url };
		} catch (error) {
			throw new BadRequestException(`Stripe portal error: ${error.message}`);
		}
	}

	async adminApplyBonus(
		userId: string,
		amountUsd: number,
	): Promise<{ success: boolean; message: string }> {
		const user = await this.userRepository.findByPk(userId);
		if (!user) {
			throw new BadRequestException('User not found');
		}

		let customerId = user.stripeCustomerId;
		if (!customerId) {
			customerId = await this.createStripeCustomer(user.email);
			user.stripeCustomerId = customerId;
			await user.save();
		}

		const amountInCents = Math.round(amountUsd * 100);

		// Создаем транзакцию баланса в Stripe
		// Отрицательная сумма в Stripe balance transaction означает кредит (средства на счету клиента)
		const today = new Date().toISOString().split('T')[0];
		try {
			await this.stripe.customers.createBalanceTransaction(
				customerId,
				{
					amount: -amountInCents,
					currency: 'usd',
					description: `Manual admin bonus applied: $${amountUsd}`,
				},
				{
					idempotencyKey: `admin-bonus-${userId}-${amountInCents}-${today}`, // Prevent duplicate bonus application on the same day
				},
			);

			return {
				success: true,
				message: `Successfully applied $${amountUsd} bonus to user ${user.email}`,
			};
		} catch (error) {
			throw new BadRequestException(`Stripe bonus error: ${error.message}`);
		}
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
