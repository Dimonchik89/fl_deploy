import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsEnum, IsOptional, IsString } from 'class-validator';
import { Role } from '../../auth/enums/role.enum';
import { SubscriptionEnum } from '../../stripe/stripe.types';

export class UpdateUserDto {
	@ApiProperty({ example: 'user@gmail.com', required: false })
	@IsOptional()
	@IsString()
	@IsEmail()
	email?: string;

	@ApiProperty({ example: Role.USER, enum: Role, required: false })
	@IsOptional()
	@IsEnum(Role)
	role?: Role;

	@ApiProperty({
		example: SubscriptionEnum.free,
		enum: SubscriptionEnum,
		required: false,
	})
	@IsOptional()
	@IsEnum(SubscriptionEnum)
	subscription?: SubscriptionEnum;
}
