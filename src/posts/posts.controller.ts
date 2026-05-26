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

@Controller('posts')
export class PostsController {
	constructor(private readonly postsService: PostsService) {}

	@ApiOperation({ summary: 'Create a post' })
	@ApiExtraModels(CreatePostDto)
	@ApiBearerAuth('access_token')
	// @ApiConsumes('multipart/form-data')
	// @ApiBody({
	// 	description: 'Форма создания поста с файлами',
	// 	schema: {
	// 		type: 'object',
	// 		properties: {
	// 			title: { type: 'string', example: 'Мой пост' },
	// 			text: { type: 'string', example: 'Основной текст' },
	// 			subtitle: { type: 'string', example: 'Подзаголовок', nullable: true },
	// 			subtext: {
	// 				type: 'string',
	// 				example: 'Дополнительный текст',
	// 				nullable: true,
	// 			},
	// 			additionalLink: {
	// 				type: 'string',
	// 				example: 'https://example.com',
	// 				nullable: true,
	// 			},
	// 			requiredFiles: {
	// 				type: 'array',
	// 				items: { type: 'string', format: 'binary' },
	// 			},
	// 			optionalFiles: {
	// 				type: 'array',
	// 				items: { type: 'string', format: 'binary' },
	// 			},
	// 		},
	// 		required: ['title', 'text', 'requiredFiles'],
	// 	},
	// })
	// @ApiBody({
	// 	description: 'Форма создания поста с файлами',
	// 	schema: {
	// 		type: 'object',
	// 		properties: {
	// 			contentHtml: {
	// 				type: 'string',
	// 				example: CONTENT_HTML_EXAMPLE,
	// 			},
	// 		},
	// 		required: ['contentHtml'],
	// 	},
	// })
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
	// @UseInterceptors(
	// 	FileFieldsInterceptor([
	// 		{ name: 'requiredFiles' },
	// 		{ name: 'optionalFiles' },
	// 	]),
	// )
	@Roles(Role.ADMIN)
	@UseGuards(RolesGuard)
	@UseGuards(JwtAuthGuard)
	@HttpCode(201)
	@UsePipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }))
	@Post()
	create(@Req() req: any, @Body() createPostDto: CreatePostDto) {
		return this.postsService.create(createPostDto);
	}
	// create(
	// 	@UploadedFiles()
	// 	files: {
	// 		requiredFiles?: Express.Multer.File[];
	// 		optionalFiles?: Express.Multer.File[];
	// 	},
	// 	@Req() req: any,
	// 	@Body() createPostDto: CreatePostDto,
	// ) {
	// 	return this.postsService.create({
	// 		requiredFiles: files.requiredFiles,
	// 		optionalFiles: files.optionalFiles,
	// 		createPostDto,
	// 	});
	// }

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
	@ApiBearerAuth('access_token')
	@ApiConsumes('multipart/form-data')
	@ApiBody({
		description: 'Форма создания поста с файлами',
		schema: {
			type: 'object',
			properties: {
				contentHtml: { type: 'string', example: CONTENT_HTML_EXAMPLE },
			},
			required: ['contentHtml'],
		},
	})
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
	// @UseInterceptors(
	// 	FileFieldsInterceptor([
	// 		{ name: 'requiredFiles' },
	// 		{ name: 'optionalFiles' },
	// 	]),
	// )
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
	// update(
	// 	@Param('id') id: string,
	// 	@Body() updatePostDto: UpdatePostDto,
	// 	@UploadedFiles()
	// 	files: {
	// 		requiredFiles?: Express.Multer.File[];
	// 		optionalFiles?: Express.Multer.File[];
	// 	},
	// ) {
	// 	return this.postsService.update({
	// 		id,
	// 		updatePostDto,
	// 		requiredFiles: files.requiredFiles,
	// 		optionalFiles: files.optionalFiles,
	// 	});
	// }

	@ApiOperation({ summary: 'Delete post' })
	@ApiBearerAuth('access_token')
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
