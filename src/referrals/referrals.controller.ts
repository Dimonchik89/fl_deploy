import {
	Body,
	Controller,
	Inject,
	Post,
	UsePipes,
	ValidationPipe,
} from '@nestjs/common';
import { CreateReferralDto } from './dto/create-referral.dto';
import { ReferralsService } from './referrals.service';
import { ApiBody, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import {
	NO_USER_WITH_THIS_LINK_EXAMPLE,
	USER_WITH_ID_NOT_FOUND_EXAMPLE,
} from './referrals.constants';

@ApiTags('Referrals')
@ApiResponse({ status: 500, description: 'Internal server error.' })
@Controller('referrals')
export class ReferralsController {
	constructor(private readonly referralsRepository: ReferralsService) {}

	@ApiOperation({
		summary:
			"Creating a record that a user registered using a friend's referral link",
	})
	@ApiBody({
		description: 'unique ID of the referral link and ID of the invited user',
		type: CreateReferralDto,
	})
	@ApiResponse({
		status: 201,
		description: 'The entry was created successfully.',
		example: { success: true },
	})
	@ApiResponse({
		status: 400,
		description: 'Not found Error',
		examples: {
			USER_WITH_ID_NOT_FOUND: USER_WITH_ID_NOT_FOUND_EXAMPLE,
			NO_USER_WITH_THIS_LINK: NO_USER_WITH_THIS_LINK_EXAMPLE,
		},
	})
	@UsePipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }))
	@Post()
	createReferral(@Body() dto: CreateReferralDto) {
		return this.referralsRepository.createReferral(dto);
	}
}
