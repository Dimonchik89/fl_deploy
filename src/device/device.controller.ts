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

@ApiTags('Devices')
@ApiBearerAuth()
@ApiResponse({ status: 500, description: 'Internal server error.' })
@Controller('device')
export class DeviceController {
	constructor(private readonly deviceService: DeviceService) {}

	@ApiOperation({
		summary: 'Register or verify a device',
		description:
			'Checks if the device serial number is already registered to the user. If it is new, registers it if the user has fewer than 2 devices.',
	})
	@ApiResponse({
		status: 201,
		description: 'Device successfully verified or registered.',
	})
	@ApiResponse({
		status: 400,
		description: 'Device limit reached or device belongs to another user.',
	})
	@ApiResponse({ status: 401, description: 'Unauthorized.' })
	@UseGuards(JwtAuthGuard)
	@UsePipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }))
	@Post()
	create(@Req() req, @Body() createDeviceDto: CreateDeviceDto) {
		return this.deviceService.create(req.user.id, createDeviceDto);
	}

	@ApiOperation({
		summary: 'Get all registered devices (Admin only)',
		description: 'Returns a list of all devices registered in the system.',
	})
	@ApiResponse({ status: 200, description: 'Return all devices.' })
	@ApiResponse({ status: 403, description: 'Forbidden (Admin only).' })
	@Roles(Role.ADMIN)
	@UseGuards(JwtAuthGuard, RolesGuard)
	@Get()
	findAll(@Req() req) {
		return this.deviceService.findAll();
	}

	@ApiOperation({
		summary: 'Remove a device',
		description: 'Deletes a device registration for the authenticated user.',
	})
	@ApiResponse({ status: 200, description: 'Device successfully removed.' })
	@ApiResponse({ status: 404, description: 'Device not found.' })
	@UseGuards(JwtAuthGuard)
	@Delete(':id')
	remove(@Param('id') id: string, @Req() req) {
		return this.deviceService.remove({ deviceId: id, userId: req.user.id });
	}
}
