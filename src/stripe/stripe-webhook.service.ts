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
import { Sequelize } from 'sequelize-typescript';

@Injectable()
export class StripeWebhookService {
	private stripe: Stripe;
	private readonly logger = new Logger(StripeWebhookService.name);

	constructor(
		@Inject('USER_REPOSITORY') private userRepository: typeof User,
		@Inject('REFERRALS_REPOSITORY')
		private referralsRepository: typeof Referrals,
		@Inject(forwardRef(() => AuthService))
		private readonly authService: AuthService,
		private mailerService: MailerService,
		@Inject('SEQUELIZE') private readonly sequelize: Sequelize,
	) {
		this.stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
			apiVersion: '2025-02-24.acacia',
		});
	}

	async checkAndApplyReferralBonus(referrerId: string) {
		let continueProcessing = true;
		while (continueProcessing) {
			const transaction = await this.sequelize.transaction();
			try {
				// Ищем всех друзей, которые оплатили (converted), но еще НЕ были использованы для бонуса (bonusApplied: false)
				// Добавляем order и lock для обеспечения атомарности и предотвращения race conditions
				const activeReferrals = await this.referralsRepository.findAll({
					where: {
						referrerId,
						status: 'converted',
						bonusApplied: false,
					},
					limit: 3,
					order: [['id', 'ASC']],
					lock: transaction.LOCK.UPDATE,
					transaction,
				});

				if (activeReferrals.length < 3) {
					await transaction.commit();
					continueProcessing = false;
					break;
				}

				const referrerUser = await this.userRepository.findOne({
					where: { id: referrerId },
					transaction,
				});

				if (!referrerUser || !referrerUser.stripeCustomerId) {
					await transaction.commit();
					return;
				}

				// Начисляем кредит в Stripe (Customer Balance)
				// Допустим, твоя подписка стоит 500 центов ($5.00)
				const AMOUNT_TO_CREDIT = 500;
				const usedIds = activeReferrals.map((ref) => ref.id);

				// Создаем ключ идемпотентности на основе ID рефералов, чтобы избежать дублей в Stripe
				const idempotencyKey = `referral-bonus-${referrerId}-${usedIds.sort().join('-')}`;

				// Сначала обновляем статус в нашей базе (в рамках транзакции)
				await this.referralsRepository.update(
					{ bonusApplied: true },
					{
						where: { id: usedIds },
						transaction,
					},
				);

				// Вызываем Stripe API с ключом идемпотентности
				await this.stripe.customers.createBalanceTransaction(
					referrerUser.stripeCustomerId,
					{
						amount: -AMOUNT_TO_CREDIT, // минус означает кредит (баланс пользователя), плюс - долг
						currency: 'usd',
						description: 'Bonus for inviting 3 friends',
					},
					{
						idempotencyKey,
					},
				);

				// Фиксируем изменения в базе
				await transaction.commit();
				this.logger.log(`Бонус начислен пользователю ${referrerId}`);

				await this.mailerService.sendMail({
					to: referrerUser.email,
					subject: 'You just earned $5.00! Thanks to your friends',
					html: templateMail(referrerUser.email),
				});

				// Цикл продолжится и проверит, есть ли еще тройки друзей
			} catch (error) {
				if (transaction) await transaction.rollback();
				this.logger.error('Ошибка при начислении кредита в Stripe:', error);
				continueProcessing = false;
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

		if (!user && event.type !== 'checkout.session.completed') {
			this.logger.error(`User not found for customer: ${object.customer}`);
			return { received: false };
		}

		switch (event.type) {
			// Событие срабатывает при первой успешной оплате, создающей подписку.
			// Именно здесь мы записываем данные о новой подписке в нашу базу.
			case 'checkout.session.completed': {
				this.logger.log(`Checkout session completed`);
				const session = object as Stripe.Checkout.Session;

				if (session.payment_status !== 'paid') {
					this.logger.warn(`Checkout session ${session.id} not paid yet`);
					break;
				}

				// Если пользователя не нашли в начале (например, новая сессия без customerId в нашей базе)
				if (!user && session.customer) {
					user = await this.userRepository.findOne({
						where: { stripeCustomerId: session.customer as string },
					});
				}

				if (!user) {
					this.logger.error(
						`User not found for session ${session.id} and customer ${session.customer}`,
					);
					break;
				}

				try {
					const subscription = await this.stripe.subscriptions.retrieve(
						session.subscription as string,
						{ expand: ['items.data.price.product'] },
					);
					const product = subscription.items.data[0].price
						.product as Stripe.Product;

					if (
						user.subscriptionId === subscription.id &&
						user.subscription === product.name
					) {
						this.logger.log(
							`[Stripe Webhook] User ${user.email} already up to date`,
						);
						break;
					}

					user.subscription = product.name as SubscriptionEnum;
					user.subscriptionId = subscription.id;
					await user.save();

					this.logger.log(
						`[Stripe Webhook] Successfully updated user ${user.email} to ${product.name}`,
					);
				} catch (error) {
					this.logger.error(
						`Error processing checkout.session.completed: ${error.message}`,
					);
				}
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
				this.logger.log(`Invoice paid for user ${user?.email}`);
				const invoice = object as Stripe.Invoice;

				// 1. Обновляем статус подписки пользователя, если это инвойс по подписке
				if (invoice.subscription && user) {
					const transaction = await this.sequelize.transaction();
					try {
						const subscription = await this.stripe.subscriptions.retrieve(
							invoice.subscription as string,
							{ expand: ['items.data.price.product'] },
						);
						const product = subscription.items.data[0].price
							.product as Stripe.Product;

						if (
							user.subscriptionId !== subscription.id ||
							user.subscription !== product.name
						) {
							user.subscription = product.name as SubscriptionEnum;
							user.subscriptionId = subscription.id;
							await user.save();
							this.logger.log(
								`User ${user.email} subscription fulfilled via invoice.paid`,
							);
						}

						await transaction.commit();
					} catch (error) {
						await transaction.rollback();
						this.logger.error(
							`Error updating user subscription in invoice.paid: ${error.message}`,
						);
					}
				}

				// 2. Логика реферальной системы
				if (user) {
					await this.referralsRepository.update(
						{ status: 'converted' },
						{
							where: {
								refereeId: user.id,
								status: 'pending',
							},
						},
					);

					const referralEntry = await this.referralsRepository.findOne({
						where: { refereeId: user.id },
					});

					if (referralEntry) {
						await this.checkAndApplyReferralBonus(referralEntry.referrerId);
					}
				}

				break;
			}

			// Событие срабатывает, если Stripe не смог провести платеж (например, у карты истёк срок, или недостаточно средств).
			// Мы переводим пользователя на бесплатный тариф, чтобы ограничить его возможности.
			case 'invoice.payment_failed': {
				this.logger.log('Invoice payment failed');
				if (user) {
					user.subscription = SubscriptionEnum.free;
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

				const product = subscription.items.data[0].price
					.product as Stripe.Product;

				if (
					subscription.status === 'active' ||
					subscription.status === 'trialing'
				) {
					// Если подписка активна или в триале, обновляем данные
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
					user.subscriptionId = subscription.id;
				} else {
					// В любом другом случае (past_due, unpaid, canceled, incomplete) - понижаем до free
					this.logger.warn(
						`[Stripe Webhook] Subscription status is ${subscription.status}. Downgrading ${user.email} to free.`,
					);
					user.subscription = SubscriptionEnum.free;
					user.subscriptionId = subscription.id; // Оставляем ID, чтобы знать, какая подписка проблемная
				}

				await user.save();
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
