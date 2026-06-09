import {
	Controller,
	Get,
	Post,
	Body,
	Param,
	Delete,
	UsePipes,
	ValidationPipe,
	UseGuards,
	Req,
	ParseUUIDPipe,
	Query,
} from '@nestjs/common';
import {
	ApiBearerAuth,
	ApiOperation,
	ApiResponse,
	ApiTags,
} from '@nestjs/swagger';
import { DeviceService } from './device.service';
import { CreateDeviceDto } from './dto/create-device.dto';
import { JwtAuthGuard } from '../auth/guards/jwt.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '../auth/enums/role.enum';
import { RolesGuard } from '../auth/guards/roles.guard';
import { PaginationParamsDto } from './dto/pagination-params.dto';
import { UNAUTHORIZED_EXAMPLE } from '../app.constants';

@ApiTags('Devices')
@ApiBearerAuth('access_token')
@ApiResponse({ status: 500, description: 'Internal server error.' })
@Controller('device')
export class DeviceController {
	constructor(private readonly deviceService: DeviceService) {}

	@ApiOperation({
		summary: 'Register a new device',
		description:
			'Registers a hardware device by its serial number. A user can have a maximum of 2 devices.',
	})
	@ApiResponse({
		status: 201,
		description: 'Device successfully registered.',
	})
	@ApiResponse({
		status: 400,
		description: 'Bad Request (Device limit reached or serial number already in use).',
	})
	@ApiResponse({
		status: 401,
		description: 'Unauthorized',
		example: UNAUTHORIZED_EXAMPLE,
	})
	@UseGuards(JwtAuthGuard)
	@UsePipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }))
	@Post()
	create(@Req() req, @Body() createDeviceDto: CreateDeviceDto) {
		return this.deviceService.create(req.user.id, createDeviceDto);
	}

	@ApiOperation({
		summary: 'Get all registered devices (Admin only)',
		description: 'Returns a paginated list of all devices registered in the system.',
	})
	@ApiResponse({
		status: 200,
		description: 'Return a list of all devices.',
	})
	@ApiResponse({
		status: 401,
		description: 'Unauthorized',
		example: UNAUTHORIZED_EXAMPLE,
	})
	@ApiResponse({
		status: 403,
		description: 'Forbidden (Admin only).',
	})
	@Roles(Role.ADMIN)
	@UseGuards(JwtAuthGuard, RolesGuard)
	@Get()
	findAll(@Req() req, @Query() params: PaginationParamsDto) {
		return this.deviceService.findAll(params);
	}

	@ApiOperation({
		summary: 'Remove a device',
		description: 'Deletes a device registration for the authenticated user.',
	})
	@ApiResponse({
		status: 200,
		description: 'Device successfully removed.',
	})
	@ApiResponse({
		status: 400,
		description: 'Bad Request (Invalid UUID format).',
	})
	@ApiResponse({
		status: 401,
		description: 'Unauthorized',
		example: UNAUTHORIZED_EXAMPLE,
	})
	@ApiResponse({
		status: 404,
		description: 'Device not found.',
	})
	@UseGuards(JwtAuthGuard)
	@Delete(':id')
	remove(@Param('id', new ParseUUIDPipe()) id: string, @Req() req) {
		return this.deviceService.remove({ deviceId: id, userId: req.user.id });
	}
}
