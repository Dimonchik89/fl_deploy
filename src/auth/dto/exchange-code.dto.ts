import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class ExchangeCodeDto {
	@ApiProperty({
		description: 'The temporary code received after OAuth redirect',
		example: 'abc-123-def',
	})
	@IsNotEmpty()
	@IsString()
	code: string;
}
