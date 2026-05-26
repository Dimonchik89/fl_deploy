import { ApiProperty } from '@nestjs/swagger';
import { IsString, Length, Max } from 'class-validator';

export class CreateReferralDto {
	@ApiProperty({
		description: 'Referral link',
		example: '6229bea9-29e5-4532-8241-bd193b1ee2bf',
	})
	@IsString()
	@Max(250)
	referral: string;

	@ApiProperty({
		description: 'User ID',
		example: 'a2ab20fc-b7de-4d91-9c59-c7d8a79ad811',
	})
	@IsString()
	@Max(250)
	refereeId: string;
}
