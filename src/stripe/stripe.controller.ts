import {
	BadRequestException,
	Body,
	Controller,
	Get,
	Headers,
	HttpCode,
	Param,
	Post,
	Query,
	RawBodyRequest,
	Req,
	UseGuards,
	UsePipes,
	ValidationPipe,
} from '@nestjs/common';
import { StripeService } from './stripe.service';
import { CheckoutDto } from './dto/checkout.dto';
import { StripePrice } from './stripe.types';
import {
	ApiBearerAuth,
	ApiBody,
	ApiOperation,
	ApiResponse,
	ApiTags,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt.guard';
import {
	INTERVAL_SERVER_ERROR,
	NO_SUCH_FILE_OR_DIRECTORY,
	UNAUTHORIZED_EXAMPLE,
} from '../app.constants';
import {
	CUSTOMER_NOT_FOUND_EXAMPLE,
	NO_SUCH_CHECKOUT_SESSION_EXAMPLE,
	NO_SUCH_PRICE_EXAMPLE,
	STRIPE_PRODUCT_EXAMPLE,
	SessionIdQueryParam,
} from './stripe.constants';
import {
	UNAUTHORIZED_ERROR,
	USER_ACCESS_TOKEN_AND_REFRESH_TOKEN_EXAMPLE,
} from '../auth/auth.constants';
import { Request } from 'express';
import Stripe from 'stripe';
import { JwtService } from '@nestjs/jwt';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '../auth/enums/role.enum';
import { RolesGuard } from '../auth/guards/roles.guard';
import { AdminApplyBonusDto } from './dto/admin-apply-bonus.dto';

@ApiTags('Stripe')
@ApiBearerAuth()
@ApiResponse({ status: 500, description: 'Internal server error.' })
@Controller('stripe')
export class StripeController {
	constructor(
		private readonly stripeService: StripeService,
		private jwtService: JwtService,
	) {}

	@ApiOperation({ summary: 'Get all products' })
	@ApiResponse({
		status: 200,
		description: 'Token is valid, return products',
		example: STRIPE_PRODUCT_EXAMPLE,
	})
	@ApiResponse({
		status: 401,
		description: 'Will not transfer user token',
		example: UNAUTHORIZED_EXAMPLE,
	})
	@Get('products')
	@UseGuards(JwtAuthGuard)
	async getPricesAndProducts() {
		return await this.stripeService.getPricesAndProducts();
	}

	@ApiOperation({
		summary:
			'Request for creating a subscription. We receive the address to which we need redirect. You need to add the selected subscription ID and user access_token to the header',
	})
	@ApiBody({
		description:
			'object with key "price" corresponding to the priceId of the product',
		type: CheckoutDto,
	})
	@ApiResponse({
		status: 200,
		description: 'Success',
		example: { url: 'https://checkout.stripe.com/c/pay' },
	})
	@ApiResponse({
		status: 401,
		description: UNAUTHORIZED_ERROR,
		example: UNAUTHORIZED_EXAMPLE,
	})
	@ApiResponse({
		status: 400,
		description: 'Bad Request (e.g. invalid priceId, Stripe error)',
		example: NO_SUCH_PRICE_EXAMPLE,
	})
	@HttpCode(200)
	@UseGuards(JwtAuthGuard)
	@UsePipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }))
	@Post('checkout')
	async checkout(@Body() dto: CheckoutDto, @Req() req) {
		return await this.stripeService.checkout(dto.price, req.user.id);
	}

	@ApiOperation({
		summary:
			'Verify successful checkout session and update user subscription. Returns new tokens.',
	})
	@ApiResponse({
		status: 200,
		description: 'User data updated, returns new access and refresh tokens',
		example: USER_ACCESS_TOKEN_AND_REFRESH_TOKEN_EXAMPLE,
	})
	@ApiResponse({
		status: 400,
		description:
			'Bad Request (e.g. payment not confirmed, Stripe session error)',
		example: { message: 'Payment not confirmed', statusCode: 400 },
	})
	@ApiResponse({
		status: 401,
		description:
			'Unauthorized (e.g. user not found, session does not belong to user)',
		example: {
			message: 'This session does not belong to you',
			statusCode: 401,
		},
	})
	@UseGuards(JwtAuthGuard)
	@Get('success')
	async success(@Query() query: SessionIdQueryParam, @Req() req) {
		return this.stripeService.success(query.session_id, req.user.id);
	}

	@ApiOperation({
		summary:
			'Request to get the Billing Portal URL, so the user can manage or cancel their subscription.',
	})
	@ApiResponse({
		status: 200,
		description: 'Success',
		example: { url: 'https://billing.stripe.com/p/session' },
	})
	@ApiResponse({
		status: 400,
		description: 'Customer not found in user record',
		example: CUSTOMER_NOT_FOUND_EXAMPLE,
	})
	@ApiResponse({
		status: 401,
		description: 'Unauthorized',
		example: UNAUTHORIZED_EXAMPLE,
	})
	@UseGuards(JwtAuthGuard)
	@Get('customer')
	async customerInfo(@Req() req) {
		return this.stripeService.customerInfo(
			req.user.stripeCustomerId,
			req.user.id,
		);
	}

	@ApiOperation({ summary: 'Admin: Apply manual bonus to user balance' })
	@ApiBody({ type: AdminApplyBonusDto })
	@ApiResponse({ status: 200, description: 'Bonus applied successfully' })
	@ApiResponse({ status: 403, description: 'Forbidden: Admin only' })
	@ApiResponse({
		status: 400,
		description: 'Bad Request (e.g. user not found, Stripe error)',
	})
	@Post('admin/apply-bonus')
	@UseGuards(JwtAuthGuard, RolesGuard)
	@UsePipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }))
	@Roles(Role.ADMIN)
	async adminApplyBonus(@Body() dto: AdminApplyBonusDto) {
		return this.stripeService.adminApplyBonus(dto.userId, dto.amount);
	}

	@Post('webhook')
	async webhook(
		@Headers('stripe-signature') signature: string,
		@Req() req: RawBodyRequest<Request>,
	) {
		const payload = req.rawBody;

		if (!payload) {
			throw new BadRequestException('Payload is empty');
		}
		if (!signature) {
			throw new BadRequestException('Stripe-Signature is missing');
		}
		return this.stripeService.webhook(payload, signature);
	}
}
