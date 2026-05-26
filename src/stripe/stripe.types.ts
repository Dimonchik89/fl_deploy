import Stripe from 'stripe';

export interface StripePrice {
	id: string;
	object: string;
	active: boolean;
	billing_scheme: string;
	created: number;
	currency: string;
	custom_unit_amount: any;
	livemode: boolean;
	lookup_key: any;
	metadata: Metadata;
	nickname: any;
	product: StripeProduct;
	recurring: StripeRecurring;
	tax_behavior: string;
	tiers_mode: any;
	transform_quantity: any;
	type: string;
	unit_amount: number;
	unit_amount_decimal: string;
}

export interface Metadata {}

// export interface StripeProduct {
// 	id: string;
// 	object: string;
// 	active: boolean;
// 	attributes: any[];
// 	created: number;
// 	default_price: string;
// 	description: string;
// 	images: any[];
// 	livemode: boolean;
// 	marketing_features: any[];
// 	metadata: Metadata2;
// 	name: string;
// 	package_dimensions: any;
// 	shippable: any;
// 	statement_descriptor: any;
// 	tax_code: any;
// 	type: string;
// 	unit_label: any;
// 	updated: number;
// 	url: any;
// }

export interface StripeProduct extends Stripe.Product {
    attributes?: string[];
}

export interface Metadata2 {}

export interface StripeRecurring {
	aggregate_usage: any;
	interval: string;
	interval_count: number;
	meter: any;
	trial_period_days: any;
	usage_type: string;
}

// ---------------------------------------------- Checkout

export interface ResponseWithURL {
	url: string;
}

export interface CheckoutSession {
	id: string;
	object: string;
	adaptive_pricing: any;
	after_expiration: any;
	allow_promotion_codes: any;
	amount_subtotal: number;
	amount_total: number;
	automatic_tax: AutomaticTax;
	billing_address_collection: any;
	cancel_url: string;
	client_reference_id: any;
	client_secret: any;
	collected_information: any;
	consent: any;
	consent_collection: any;
	created: number;
	currency: string;
	currency_conversion: any;
	custom_fields: any[];
	custom_text: CustomText;
	customer: any;
	customer_creation: string;
	customer_details: any;
	customer_email: any;
	discounts: any[];
	expires_at: number;
	invoice: any;
	invoice_creation: any;
	livemode: boolean;
	locale: any;
	metadata: Metadata;
	mode: string;
	payment_intent: any;
	payment_link: any;
	payment_method_collection: string;
	payment_method_configuration_details: PaymentMethodConfigurationDetails;
	payment_method_options: PaymentMethodOptions;
	payment_method_types: string[];
	payment_status: string;
	permissions: any;
	phone_number_collection: PhoneNumberCollection;
	recovered_from: any;
	saved_payment_method_options: SavedPaymentMethodOptions;
	setup_intent: any;
	shipping_address_collection: any;
	shipping_cost: any;
	shipping_details: any;
	shipping_options: any[];
	status: string;
	submit_type: any;
	subscription: any;
	success_url: string;
	total_details: TotalDetails;
	ui_mode: string;
	url: string;
}

export interface AutomaticTax {
	enabled: boolean;
	liability: any;
	status: any;
}

export interface CustomText {
	after_submit: any;
	shipping_address: any;
	submit: any;
	terms_of_service_acceptance: any;
}

export interface Metadata {}

export interface PaymentMethodConfigurationDetails {
	id: string;
	parent: any;
}

export interface PaymentMethodOptions {
	card: Card;
}

export interface Card {
	request_three_d_secure: string;
}

export interface PhoneNumberCollection {
	enabled: boolean;
}

export interface SavedPaymentMethodOptions {
	allow_redisplay_filters: string[];
	payment_method_remove: any;
	payment_method_save: any;
}

export interface TotalDetails {
	amount_discount: number;
	amount_shipping: number;
	amount_tax: number;
}

// ------------------------------------------------

export enum SubscriptionEnum {
	free = 'free',
	started = 'started',
	pro = 'pro',
}
