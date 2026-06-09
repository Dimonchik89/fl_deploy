import {
	Body,
	Controller,
	Inject,
	Post,
	UseGuards,
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
import { JwtAuthGuard } from '../auth/guards/jwt.guard';

@ApiTags('Referrals')
@ApiResponse({ status: 500, description: 'Internal server error.' })
@Controller('referrals')
export class ReferralsController {
	constructor(private readonly referralsService: ReferralsService) {}

	@ApiOperation({
		summary:
			"Create a referral record when a user registers via a friend's link",
		description:
			'Links the new user (referee) to the person who invited them (referrer) using the referral code.',
	})
	@ApiBody({
		description: 'Unique referral code and ID of the invited user',
		type: CreateReferralDto,
	})
	@ApiResponse({
		status: 201,
		description: 'The referral record was created successfully.',
		example: { success: true },
	})
	@ApiResponse({
		status: 400,
		description: 'Bad Request (e.g. self-referral or validation failed)',
	})
	@ApiResponse({
		status: 404,
		description: 'Not Found (Referrer or Referee not found)',
		examples: {
			USER_WITH_ID_NOT_FOUND: USER_WITH_ID_NOT_FOUND_EXAMPLE,
			NO_USER_WITH_THIS_LINK: NO_USER_WITH_THIS_LINK_EXAMPLE,
		},
	})
	@UsePipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }))
	@UseGuards(JwtAuthGuard)
	@Post()
	createReferral(@Body() dto: CreateReferralDto) {
		return this.referralsService.createReferral(dto);
	}
}
