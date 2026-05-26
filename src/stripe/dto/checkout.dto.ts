import { ApiProperty } from '@nestjs/swagger';

export class CheckoutDto {
	@ApiProperty({
		description: 'Product priceId',
		example: 'price_3R7DIGJfg0ar1hBiEIWUmKUE',
	})
	price: string;
}
