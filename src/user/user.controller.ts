import {
	Body,
	Controller,
	Delete,
	Get,
	Inject,
	Param,
	Patch,
	Query,
	UseGuards,
	UsePipes,
	ValidationPipe,
} from '@nestjs/common';
import { UserService } from './user.service';
import { JwtAuthGuard } from '../auth/guards/jwt.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '../auth/enums/role.enum';
import { ApiOperation, ApiParam, ApiQuery, ApiResponse } from '@nestjs/swagger';
import { FORBIDDEN_EXAMPLE } from '../app.constants';
import {
	GET_ONE_USER_EXAMPLE,
	GET_USERS_SUCCESS_EXAMPLE,
	USER_NOT_FOUND_EXAMPLE,
} from './user.constants';
import { UNAUTHORIZED_EXAMPLE } from '../app.constants';
import { UpdateUserDto } from './dto/update-user.dto';

@Controller('user')
export class UserController {
	constructor(private readonly userService: UserService) {}

	@ApiOperation({ summary: 'Get all users' })
	@ApiQuery({
		name: 'page',
		required: false,
		description: 'Page number',
	})
	@ApiQuery({
		name: 'limit',
		required: false,
		description: 'User limit',
	})
	@ApiResponse({
		status: 200,
		description: 'Get users',
		example: GET_USERS_SUCCESS_EXAMPLE,
	})
	@ApiResponse({
		status: 401,
		description: 'Unauthorized',
		example: UNAUTHORIZED_EXAMPLE,
	})
	@ApiResponse({
		status: 403,
		description: 'Forbidden',
		example: FORBIDDEN_EXAMPLE,
	})
	@Roles(Role.ADMIN)
	@UseGuards(RolesGuard)
	@UseGuards(JwtAuthGuard)
	@Get()
	getAll(@Query() params: { limit: string; page: string }) {
		return this.userService.getAll(params);
	}

	@ApiOperation({ summary: 'Find one user' })
	@ApiResponse({
		status: 200,
		description: 'Get one user',
		example: GET_ONE_USER_EXAMPLE,
	})
	@ApiResponse({
		status: 401,
		description: 'Unauthorized',
		example: UNAUTHORIZED_EXAMPLE,
	})
	@ApiResponse({
		status: 403,
		description: 'Forbidden',
		example: FORBIDDEN_EXAMPLE,
	})
	@ApiResponse({
		status: 404,
		description: 'Not Found',
		example: USER_NOT_FOUND_EXAMPLE,
	})
	// @Roles(Role.ADMIN)
	// @UseGuards(RolesGuard)
	@UseGuards(JwtAuthGuard)
	@Get(':id')
	getOne(@Param('id') id: string) {
		return this.userService.getOne(id);
	}

	@ApiOperation({ summary: 'Update one user' })
	@ApiResponse({
		status: 200,
		description: 'Updated successfully',
		example: GET_ONE_USER_EXAMPLE,
	})
	@ApiResponse({
		status: 401,
		description: 'Unauthorized',
		example: UNAUTHORIZED_EXAMPLE,
	})
	@ApiResponse({
		status: 403,
		description: 'Forbidden',
		example: FORBIDDEN_EXAMPLE,
	})
	@ApiResponse({
		status: 404,
		description: 'Not Found',
		example: USER_NOT_FOUND_EXAMPLE,
	})
	@Roles(Role.ADMIN)
	@UseGuards(RolesGuard)
	@UseGuards(JwtAuthGuard)
	@Patch(':id')
	@UsePipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }))
	updateUser(@Param('id') id: string, @Body() dto: UpdateUserDto) {
		return this.userService.updateOne(id, dto);
	}

	@ApiOperation({ summary: 'Delete user' })
	@ApiResponse({
		status: 200,
		description: 'Deleted user successfully',
		example: {
			statusCode: 200,
			message: `The user 879cdf73-993e-40bc-809e-ad8e20cb0bf0 was deleted`,
		},
	})
	@ApiResponse({
		status: 401,
		description: 'Unauthorized',
		example: UNAUTHORIZED_EXAMPLE,
	})
	@ApiResponse({
		status: 403,
		description: 'Forbidden',
		example: FORBIDDEN_EXAMPLE,
	})
	@ApiResponse({
		status: 404,
		description: 'Not Found',
		example: USER_NOT_FOUND_EXAMPLE,
	})
	@Roles(Role.ADMIN)
	@UseGuards(RolesGuard)
	@UseGuards(JwtAuthGuard)
	@Delete(':id')
	deleteUser(@Param('id') id: string) {
		return this.userService.deleteOne(id);
	}
}
