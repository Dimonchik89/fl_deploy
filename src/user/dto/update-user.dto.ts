import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsOptional, IsString } from 'class-validator';

export class UpdateUserDto {
	@ApiProperty({ example: 'user@gmail.com' })
	@IsString()
	@IsEmail()
	email: string;

	// @ApiProperty({ example: 'free' })
	// @IsString()
	// subscription: string;

	// @ApiProperty({ example: 50 })
	// @IsOptional()
	// maxFolderSize: number;
}
