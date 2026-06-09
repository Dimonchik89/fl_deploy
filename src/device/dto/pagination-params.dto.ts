import { IsOptional } from 'class-validator';

export class PaginationParamsDto {
	@IsOptional()
	limit: string;

	@IsOptional()
	page: string;
}
