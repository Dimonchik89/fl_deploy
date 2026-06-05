import {
	Controller,
	Get,
	Post,
	Body,
	Patch,
	Param,
	Delete,
	UseGuards,
	HttpCode,
	UploadedFiles,
	Headers,
	Req,
	UseInterceptors,
	UsePipes,
	ValidationPipe,
	Query,
} from '@nestjs/common';
import { PostsService } from './posts.service';
import { CreatePostDto } from './dto/create-post.dto';
import { UpdatePostDto } from './dto/update-post.dto';
import { RolesGuard } from '../auth/guards/roles.guard';
import {
	ApiBearerAuth,
	ApiBody,
	ApiConsumes,
	ApiExtraModels,
	ApiOperation,
	ApiQuery,
	ApiResponse,
	ApiTags,
} from '@nestjs/swagger';
import { FileFieldsInterceptor } from '@nestjs/platform-express';
import { JwtAuthGuard } from '../auth/guards/jwt.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '../auth/enums/role.enum';
import {
	CONTENT_HTML_EXAMPLE,
	CREATE_FILE_ERROR_REQUIRE_FIELDS_EXAMPLE,
	DELETE_FILE_EXAMPLE,
	GET_POSTS_SUCCESS_EXAMPLE,
	POST_EXAMPLE,
} from './posts.constants';
import {
	BAD_REQUEST,
	BAD_REQUEST_EXAMPLE,
	UNAUTHORIZED_EXAMPLE,
} from '../app.constants';

@ApiTags('Posts')
@ApiBearerAuth()
@ApiResponse({ status: 500, description: 'Internal server error.' })
@Controller('posts')
export class PostsController {
	constructor(private readonly postsService: PostsService) {}

	@ApiOperation({ summary: 'Create a post' })
	@ApiExtraModels(CreatePostDto)
	@ApiResponse({
		status: 201,
		description: 'Post created',
		example: POST_EXAMPLE,
	})
	@ApiResponse({
		status: 401,
		description: 'Unauthorized',
		example: UNAUTHORIZED_EXAMPLE,
	})
	@ApiResponse({
		status: 400,
		description: 'Required fields are missing',
		example: CREATE_FILE_ERROR_REQUIRE_FIELDS_EXAMPLE,
	})
	@Roles(Role.ADMIN)
	@UseGuards(RolesGuard)
	@UseGuards(JwtAuthGuard)
	@HttpCode(201)
	@UsePipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }))
	@Post()
	create(@Req() req: any, @Body() createPostDto: CreatePostDto) {
		return this.postsService.create(createPostDto);
	}

	@ApiOperation({ summary: 'Get all posts' })
	@ApiQuery({
		name: 'page',
		required: false,
		description: 'Page number (optional)',
		example: '1',
	})
	@ApiQuery({
		name: 'limit',
		required: false,
		description: 'Number of elements per page (optional)',
		example: 10,
	})
	@ApiResponse({
		status: 200,
		description: 'Get posts',
		example: GET_POSTS_SUCCESS_EXAMPLE,
	})
	@ApiResponse({
		status: 400,
		description: BAD_REQUEST,
		example: BAD_REQUEST_EXAMPLE,
	})
	@Get()
	findAll(@Query() param: { page?: string; limit?: string }) {
		return this.postsService.findAll(param);
	}

	@ApiOperation({ summary: 'Get one posts' })
	@ApiResponse({
		status: 200,
		description: 'Get post',
		example: POST_EXAMPLE,
	})
	@ApiResponse({
		status: 400,
		description: BAD_REQUEST,
		example: BAD_REQUEST_EXAMPLE,
	})
	@Get(':id')
	findOne(@Param('id') id: string) {
		return this.postsService.findOne(id);
	}

	@ApiOperation({ summary: 'Edit post' })
	@ApiResponse({
		status: 201,
		description: 'Post updated',
		example: POST_EXAMPLE,
	})
	@ApiResponse({
		status: 401,
		description: 'Unauthorized',
		example: UNAUTHORIZED_EXAMPLE,
	})
	@ApiResponse({
		status: 400,
		description: BAD_REQUEST,
		example: BAD_REQUEST_EXAMPLE,
	})
	@Roles(Role.ADMIN)
	@UseGuards(RolesGuard)
	@UseGuards(JwtAuthGuard)
	@UsePipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }))
	@Patch(':id')
	update(@Param('id') id: string, @Body() updatePostDto: UpdatePostDto) {
		return this.postsService.update({
			id,
			updatePostDto,
		});
	}

	@ApiOperation({ summary: 'Delete post' })
	@ApiResponse({
		status: 200,
		description: 'Delete file',
		example: DELETE_FILE_EXAMPLE,
	})
	@ApiResponse({
		status: 400,
		description: BAD_REQUEST,
		example: BAD_REQUEST_EXAMPLE,
	})
	@ApiResponse({
		status: 401,
		description: 'Unauthorized',
		example: UNAUTHORIZED_EXAMPLE,
	})
	@Roles(Role.ADMIN)
	@UseGuards(RolesGuard)
	@UseGuards(JwtAuthGuard)
	@UsePipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }))
	@Delete(':id')
	remove(@Param('id') id: string) {
		return this.postsService.remove(id);
	}
}
