import { ApiProperty } from '@nestjs/swagger';

export const STRIPE_PRODUCT_EXAMPLE = [
	{
		id: 'price_3R7DIGJfg0ar1hBiEIWUmKUE',
		object: 'price',
		active: true,
		billing_scheme: 'per_unit',
		created: 3743069852,
		currency: 'usd',
		custom_unit_amount: null,
		livemode: false,
		lookup_key: null,
		metadata: {},
		nickname: null,
		product: {
			id: 'prod_S3Fn74iqLAIZc9',
			object: 'product',
			active: true,
			attributes: [],
			created: 1743069852,
			default_price: 'price_3R7DIGJfg0ar1hBiEIWUmKUE',
			description: 'Professional subscription',
			images: [],
			livemode: false,
			marketing_features: [],
			metadata: {},
			name: 'Pro',
			package_dimensions: null,
			shippable: null,
			statement_descriptor: null,
			tax_code: null,
			type: 'service',
			unit_label: null,
			updated: 3743069853,
			url: null,
		},
		recurring: {
			aggregate_usage: null,
			interval: 'month',
			interval_count: 1,
			meter: null,
			trial_period_days: null,
			usage_type: 'licensed',
		},
		tax_behavior: 'unspecified',
		tiers_mode: null,
		transform_quantity: null,
		type: 'recurring',
		unit_amount: 200,
		unit_amount_decimal: '200',
	},
];

export const CUSTOMER_NOT_FOUND_ERROR = 'Customer not found';

export const NO_SUCH_PRICE_EXAMPLE = {
	statusCode: 400,
	message: "No such price: 'price_3R7DIGJfg0ar1hBiEIWUmKUE'",
};

export const NO_SUCH_CHECKOUT_SESSION_EXAMPLE = {
	statusCode: 404,
	message:
		'No such checkout.session: cs_test_a1F5GFpLTPnbBoB8mZ4rasgsrlWJDHcv70Gx5yfCQfFRZy9TbdHdU',
};

export const CUSTOMER_NOT_FOUND_EXAMPLE = {
	message: 'Customer not found',
	error: 'Bad Request',
	statusCode: 400,
};

export class SessionIdQueryParam {
	@ApiProperty({
		description: 'Session id query params',
		name: 'session_id',
	})
	session_id: string;
}
