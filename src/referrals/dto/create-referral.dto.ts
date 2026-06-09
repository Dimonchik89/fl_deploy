import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, IsUUID } from 'class-validator';

export class CreateReferralDto {
	@ApiProperty({
		description: 'Referral code of the person who invited',
		example: '6229bea9-29e5-4532-8241-bd193b1ee2bf',
	})
	@IsString()
	@IsNotEmpty()
	referral: string;

	@ApiProperty({
		description: 'User ID of the invited person',
		example: 'a2ab20fc-b7de-4d91-9c59-c7d8a79ad811',
	})
	@IsUUID()
	@IsNotEmpty()
	refereeId: string;
}
