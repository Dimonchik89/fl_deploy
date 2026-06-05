import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsNumber, IsUUID, Min } from 'class-validator';

export class AdminApplyBonusDto {
	@ApiProperty({ example: 'd0a5a5a5-a5a5-a5a5-a5a5-a5a5a5a5a5a5', description: 'ID of the user to receive the bonus' })
	@IsNotEmpty()
	@IsUUID()
	userId: string;

	@ApiProperty({ example: 5.0, description: 'Amount of bonus in USD' })
	@IsNotEmpty()
	@IsNumber()
	@Min(1)
	amount: number;
}
