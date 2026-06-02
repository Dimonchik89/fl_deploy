import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty } from 'class-validator';

export class CreateDeviceDto {
	@ApiProperty({
		example: 'SN-12345-ABCDE',
		description: 'The unique serial number of the hardware device',
	})
	@IsString()
	@IsNotEmpty()
	serialNumber: string;
}
