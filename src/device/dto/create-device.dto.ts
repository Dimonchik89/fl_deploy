import { IsString, IsUUID } from 'class-validator';

export class CreateDeviceDto {
	@IsString()
	@IsUUID()
	userId: string;

	@IsString()
	serialNumber: string;
}
