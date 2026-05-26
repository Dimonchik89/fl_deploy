import {
	Injectable,
	Inject,
	BadRequestException,
	UnauthorizedException,
	forwardRef,
	Logger,
} from '@nestjs/common';
import Stripe from 'stripe';
import { User } from '../entities/user.entity';
import { StripeProduct, SubscriptionEnum } from './stripe.types';
import { AuthService } from 'src/auth/auth.service';
import { Referrals } from '../entities/referrals.entity';
import { MailerService } from '@nestjs-modules/mailer';
import { templateMail } from '../templates/template';
@Injectable()
export class StripeWebhookService {
	private stripe: Stripe;
	private readonly logger = new Logger(StripeWebhookService.name);

	constructor(
		@Inject('USER_REPOSITORY') private userRepository: typeof User,
		// private readonly authService: AuthService
		@Inject('REFERRALS_REPOSITORY')
		private referralsRepository: typeof Referrals,
		@Inject(forwardRef(() => AuthService))
		private readonly authService: AuthService,
		private mailerService: MailerService,
	) {
		this.stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
			apiVersion: '2025-02-24.acacia',
		});
	}

	private returnNewFolderSize(subscriptionName: string): number {
		switch (subscriptionName?.toLowerCase()) {
			case SubscriptionEnum.pro:
				return 150;
			case SubscriptionEnum.started:
				return 100;
			default:
				return 50;
		}
	}

	async checkAndApplyReferralBonus(referrerId: string) {
		// Ищем всех друзей, которые оплатили (converted), но еще НЕ были использованы для бонуса (bonusApplied: false)
		const activeReferrals = await this.referralsRepository.findAll({
			where: {
				referrerId,
				status: 'converted',
				bonusApplied: false,
			},
			limit: 3,
		});

		if (activeReferrals.length >= 3) {
			const referrerUser = await this.userRepository.findOne({
				where: { id: referrerId },
			});

			if (!referrerUser || !referrerUser.stripeCustomerId) {
				return;
			}

			try {
				// Начисляем кредит в Stripe (Customer Balance)
				// Допустим, твоя подписка стоит 500 центов ($5.00)
				const AMOUNT_TO_CREDIT = 500;

				await this.stripe.customers.createBalanceTransaction(
					referrerUser.stripeCustomerId,
					{
						amount: -AMOUNT_TO_CREDIT, // минус означает кредит (баланс пользователя), плюс - долг
						currency: 'usd',
						description: 'Bonus for inviting 3 friends',
					},
				);

				const usedIds = activeReferrals.map((user) => user.id);
				await this.referralsRepository.update(
					{ bonusApplied: true },
					{ where: { id: usedIds } },
				);

				this.logger.log(`Бонус начислен пользователю ${referrerId}`);

				// await this.mailerService.sendMail({
				//     to: referrerUser.email,
				//     subject: "You just earned $5.00! Thanks to your friends",
				//     template: './referral-bonus',
				//     context: {
				//         name: referrerUser.email || "there"
				//     }
				// })
				await this.mailerService.sendMail({
					to: referrerUser.email,
					subject: 'You just earned $5.00! Thanks to your friends',
					html: templateMail(referrerUser.email),
				});

				// Если у юзера было, например, сразу 6 или 9 друзей,
				// проверяем еще раз, пока не закончатся тройки
				await this.checkAndApplyReferralBonus(referrerId);
			} catch (error) {
				this.logger.error('Ошибка при начислении кредита в Stripe:', error);
			}
		}
	}

	async handleWebhook(event: Stripe.Event): Promise<{ received: boolean }> {
		const object = event.data.object as any;

		let user: User;
		if (object.customer) {
			user = await this.userRepository.findOne({
				where: { stripeCustomerId: object.customer },
			});
		}

		// console.log("user!!!!!!!!!!!!!!!1", user);

		if (!user && event.type !== 'checkout.session.completed') {
			this.logger.error(`User not found for customer: ${object.customer}`);
			return { received: false };
		}

		switch (event.type) {
			// Событие срабатывает при первой успешной оплате, создающей подписку.
			// Именно здесь мы записываем данные о новой подписке в нашу базу.
			// case 'checkout.session.completed': {
			//     console.log(`Checkout session completed`);
			//     const session = object as Stripe.Checkout.Session;
			//     // Чтобы получить данные о продукте, нужно развернуть подписку
			//     const subscription = await this.stripe.subscriptions.retrieve(
			//         session.subscription as string,
			//         { expand: ['items.data.price.product'] }
			//     );
			//     const product = subscription.items.data[0].price.product as StripeProduct;
			//     console.log("completed product!!!!!!!!!!!!!!!", product);

			//     if (user) {
			//         user.subscription = product.name as SubscriptionEnum;
			//         user.maxFolderSize = this.returnNewFolderSize(product.name as string);
			//         user.subscriptionId = subscription.id;
			//         user.stripeCustomerId = session.customer as string;
			//         await user.save();
			//     } else {
			//         console.log(`New user via checkout, but not found in DB. Data:`, object);
			//     }
			//     break;
			// }

			case 'checkout.session.completed': {
				this.logger.log(`Checkout session completed`);
				const session = object as Stripe.Checkout.Session;
				// Чтобы получить данные о продукте, нужно развернуть подписку
				// const subscription = await this.stripe.subscriptions.retrieve(
				//     session.subscription as string,
				//     { expand: ['items.data.price.product'] }
				// );
				// const product = subscription.items.data[0].price.product as StripeProduct;
				// console.log("completed subscription!!!!!!!!!!!!!!!", subscription);
				// console.log("completed product!!!!!!!!!!!!!!!", product);

				// if (subscription.status === 'canceled') {
				//     user.subscription = SubscriptionEnum.free;
				//     user.maxFolderSize = this.returnNewFolderSize(SubscriptionEnum.free);
				//     user.subscriptionId = null; // Обнуляем ID подписки
				//     await user.save();
				//     await this.stripe.subscriptions.cancel(user.subscriptionId);
				// } else if (user) {
				//     if (user.subscriptionId && user.subscriptionId !== subscription.id) {
				//         console.log(`User already has a subscription: ${user.subscriptionId}. Canceling it.`);
				//         try {
				//             await this.stripe.subscriptions.cancel(user.subscriptionId);
				//         } catch (error) {
				//             console.error('Failed to cancel old subscription:', error);
				//         }
				//     }

				//     user.subscription = product.name as SubscriptionEnum;
				//     user.maxFolderSize = this.returnNewFolderSize(product.name as string);
				//     user.subscriptionId = subscription.id;
				//     await user.save();
				// } else {
				//     console.log(`New user via checkout, but not found in DB. Data:`, object);
				// }

				break;
			}

			case 'customer.subscription.created': {
				this.logger.log(`Subscription created`);
				const subscription = object as Stripe.Subscription;
				const product = subscription.items.data[0].price
					.product as StripeProduct;
				this.logger.log(`created product!!!!!!!!!!!!!!! ${product}`);

				//  if(user) {
				//     if (user.subscriptionId && user.subscriptionId !== subscription.id) {
				//         console.log(`User already has a subscription: ${user.subscriptionId}. Canceling it.`);
				//         try {
				//             await this.stripe.subscriptions.cancel(user.subscriptionId);
				//         } catch (error) {
				//             console.error('Failed to cancel old subscription:', error);
				//         }
				//     }

				//     user.subscription = product.name as SubscriptionEnum;
				//     user.maxFolderSize = this.returnNewFolderSize(product.name as string);
				//     user.subscriptionId = subscription.id;
				//     await user.save();
				//  } else {
				//     console.log(`New user via created subscription, but not found in DB. Data:`, object);
				//  }

				//  if (user.subscriptionId && user.subscriptionId !== subscription.id) {
				//     console.log(`User already has a subscription. Canceling old one.`);
				//     try {
				//         await this.stripe.subscriptions.cancel(user.subscriptionId);
				//     } catch (error) {
				//         console.error('Failed to cancel old subscription:', error);
				//     }
				// }

				break;
			}

			// Событие срабатывает каждый раз, когда Stripe успешно снимает платеж по подписке.
			// Здесь можно добавить логику, если нужно. Например, отправить уведомление.
			case 'invoice.paid': {
				// ---------- Тест изменения статуса подписки в рефералке -------------

				await this.referralsRepository.update(
					{ status: 'converted' },
					{ where: { refereeId: user.id } },
				);

				const referralEntry = await this.referralsRepository.findOne({
					where: { refereeId: user.id },
				});

				if (referralEntry) {
					await this.checkAndApplyReferralBonus(referralEntry.referrerId);
				}
				// -----------------------
				this.logger.log('Invoice paid');
				break;
			}

			// Событие срабатывает, если Stripe не смог провести платеж (например, у карты истёк срок, или недостаточно средств).
			// Мы переводим пользователя на бесплатный тариф, чтобы ограничить его возможности.
			case 'invoice.payment_failed': {
				this.logger.log('Invoice payment failed');
				if (user) {
					user.subscription = SubscriptionEnum.free;
					user.maxFolderSize = this.returnNewFolderSize(SubscriptionEnum.free);
					await user.save();
				}
				break;
			}

			// Событие срабатывает при любых изменениях в подписке (например, смене тарифа).
			// Здесь мы обновляем тариф и лимит памяти в зависимости от нового статуса подписки.
			case 'customer.subscription.updated': {
				this.logger.log('Subscription updated');

				const subscriptionTail = object as Stripe.Subscription;

				const subscription = await this.stripe.subscriptions.retrieve(
					subscriptionTail.id as string,
					{ expand: ['items.data.price.product'] },
				);

				if (!user) {
					this.logger.warn('[Stripe Webhook] User not found');
					break;
				}

				if (
					subscription.status === 'active' ||
					subscription.status == 'trialing'
				) {
					const product = subscription.items.data[0].price
						.product as StripeProduct;

					// защита от дублей (Stripe может слать одно и то же событие несколько раз)
					if (
						user.subscriptionId === subscription.id &&
						user.subscription === product.name
					) {
						this.logger.log('[Stripe Webhook] Subscription already up to date');
						break;
					}

					this.logger.log(
						`[Stripe Webhook] Updating ${user.email} to ${product.name}`,
					);
					user.subscription = product.name as SubscriptionEnum;
					user.maxFolderSize = this.returnNewFolderSize(product.name);
					user.subscriptionId = subscription.id;

					await user.save();
				}

				break;
			}

			// Событие срабатывает, когда подписка полностью удалена (например, после отмены в конце периода).
			// Мы обнуляем данные о подписке и переводим пользователя на бесплатный тариф.
			case 'customer.subscription.deleted': {
				this.logger.log('Subscription deleted');
				const subscription = object as Stripe.Subscription;

				const user = await this.userRepository.findOne({
					where: { stripeCustomerId: subscription.customer as string },
				});

				if (!user) {
					this.logger.error(
						`User with customerId ${subscription.customer} not found`,
					);
					break;
				}

				if (
					user.subscriptionId === subscription.id &&
					user.subscription === 'free'
				) {
					return;
				}

				user.subscription = SubscriptionEnum.free;
				user.maxFolderSize = this.returnNewFolderSize(SubscriptionEnum.free);
				user.subscriptionId = null;
				await user.save();
				this.logger.log(`User ${user.email} downgraded to free`);

				break;
			}

			default:
				this.logger.log(`Unhandled event type ${event.type}.`);
		}

		return { received: true };
	}
}
