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
} from '@nestjs/common';
import { StripeService } from './stripe.service';
import { CheckoutDto } from './dto/checkout.dto';
import { StripePrice } from './stripe.types';
import {
	ApiBearerAuth,
	ApiBody,
	ApiOperation,
	ApiResponse,
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

@Controller('stripe')
export class StripeController {
	constructor(
		private readonly stripeService: StripeService,
		private jwtService: JwtService,
	) {}

	@ApiOperation({ summary: 'Get all products' })
	@ApiBearerAuth('access_token')
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
			'object with key "type" and value corresponding to the priceId of the product',
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
		description: 'No such price',
		example: NO_SUCH_PRICE_EXAMPLE,
	})
	@ApiResponse({
		status: 500,
		description: 'Request body not added',
		example: INTERVAL_SERVER_ERROR,
	})
	@HttpCode(200)
	@UseGuards(JwtAuthGuard)
	@ApiBearerAuth('access_token')
	@Post('checkout')
	async checkout(@Body() dto: CheckoutDto, @Req() req) {
		return await this.stripeService.checkout(dto.price, req.user.id);
	}

	@ApiOperation({
		summary:
			'After the operation checkout (breakpoint "checkout") redirects us to the user page which is responsible for a successful subscription. On they we make a request for the current breakpoint (success) and as searchParams session_id we pass the session_id obtained from the URL string by which we will receive a session with the current subscription and make changes to the user table',
	})
	@ApiResponse({
		status: 200,
		description: 'User data updated',
		example: USER_ACCESS_TOKEN_AND_REFRESH_TOKEN_EXAMPLE,
	})
	@ApiResponse({
		status: 404,
		description: 'No such checkout.session',
		example: NO_SUCH_CHECKOUT_SESSION_EXAMPLE,
	})
	@ApiResponse({
		status: 500,
		description: 'Internal server error',
		example: INTERVAL_SERVER_ERROR,
	})
	@UseGuards(JwtAuthGuard)
	@ApiBearerAuth('access_token')
	@Get('success')
	async success(@Query() query: SessionIdQueryParam, @Req() req) {
		return this.stripeService.success(query.session_id, req.user.id);
	}

	// @ApiOperation({
	// 	summary:
	// 		"Request to get the URL, so that later you can go to it and end up on a page with information about the user's subscription and the ability to unsubscribe",
	// })
	// @ApiResponse({
	// 	status: 200,
	// 	description: 'Success',
	// 	example: USER_ACCESS_TOKEN_AND_REFRESH_TOKEN_EXAMPLE,
	// })
	// @ApiResponse({
	// 	status: 400,
	// 	description: 'Customer not found',
	// 	example: CUSTOMER_NOT_FOUND_EXAMPLE,
	// })
	// @ApiResponse({
	// 	status: 404,
	// 	description: 'Not Found',
	// 	example: NO_SUCH_FILE_OR_DIRECTORY,
	// })
	// @UseGuards(JwtAuthGuard)
	// @ApiBearerAuth('access_token')
	// @Get('customer/:customerId')
	// async customerInfo(@Param('customerId') customerId: string, @Req() req) {
	// 	return this.stripeService.customerInfo(customerId, req.user.id);
	// }

	@ApiOperation({
		summary:
			"Request to get the URL, so that later you can go to it and end up on a page with information about the user's subscription and the ability to unsubscribe. Need to send access token in header",
	})
	@ApiResponse({
		status: 200,
		description: 'Success',
		example: USER_ACCESS_TOKEN_AND_REFRESH_TOKEN_EXAMPLE,
	})
	@ApiResponse({
		status: 400,
		description: 'Customer not found',
		example: CUSTOMER_NOT_FOUND_EXAMPLE,
	})
	@ApiResponse({
		status: 404,
		description: 'Not Found',
		example: NO_SUCH_FILE_OR_DIRECTORY,
	})
	@UseGuards(JwtAuthGuard)
	@ApiBearerAuth('access_token')
	@Get('customer')
	async customerInfo(@Req() req) {
		const customerId = req.user.stripeCustomerId;
		console.log(req.headers.authorization);
		const token = req.headers.authorization.split(' ').pop();

		const decoded = await this.jwtService.decode(token);

		if (!decoded.stripeCustomerId) {
			throw new BadRequestException('Customer not found');
		}

		return this.stripeService.customerInfo(
			decoded.stripeCustomerId,
			req.user.id,
		);
	}

	@Post('webhook')
	async webhook(
		@Headers('stripe-signature') signature: string,
		@Req() req: RawBodyRequest<Request>,
	) {
		// let payload = req.rawBody;
		// const sig = req.headers['stripe-signature'];

		// return this.stripeService.webhook(payload, sig);

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
