import {
	BadRequestException,
	Body,
	Controller,
	Get,
	HttpCode,
	Inject,
	Param,
	Post,
	Query,
	Req,
	Res,
	UseGuards,
	UsePipes,
	ValidationPipe,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthDto, RegisterDto } from './dto/auth.dto';
import {
	ALREADY_REGISTERED_ERROR,
	INVALID_PASSWORD_EXAMPLE,
	USER_ALREADY_REGISTERED_EXAMPLE,
	USER_NOT_FOUND_EXAMPLE,
	PROPERTY_SHOULD_NOT_EXIST_EXAMPLE,
	USER_ACCESS_TOKEN_AND_REFRESH_TOKEN_EXAMPLE,
	USER_PROFILE_EXAMPLE,
	UNAUTHORIZED_ERROR,
} from './auth.constants';
import {
	ApiBearerAuth,
	ApiBody,
	ApiOperation,
	ApiResponse,
	ApiTags,
} from '@nestjs/swagger';
import { JwtAuthGuard } from './guards/jwt.guard';
import { RefreshAuthGuard } from './guards/refresh-auth.guard';
import { Roles } from './decorators/roles.decorator';
import { Role } from './enums/role.enum';
import { RolesGuard } from './guards/roles.guard';
import { GoogleAuthGuard } from './guards/google-auth.guard';
import { UNAUTHORIZED_EXAMPLE } from '../app.constants';
import clientConfig from './config/client.config';
import { ConfigType } from '@nestjs/config';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
	constructor(
		private readonly authService: AuthService,
		@Inject(clientConfig.KEY)
		private clientConfiguration: ConfigType<typeof clientConfig>,
	) {}

	@ApiOperation({
		summary:
			'Send your password and email as login for registration in the body of the request',
	})
	@ApiBody({
		description: 'JSON with login and password for registration',
		type: AuthDto,
	})
	@ApiResponse({
		status: 201,
		description: 'User has been successfully registered',
		example: USER_ACCESS_TOKEN_AND_REFRESH_TOKEN_EXAMPLE,
	})
	@ApiResponse({
		status: 400,
		description: 'User is already registered or incorrect property',
		examples: {
			USER_ALREADY_REGISTERED: USER_ALREADY_REGISTERED_EXAMPLE,
			PROPERTY_SHOULD_NOT_EXIST: PROPERTY_SHOULD_NOT_EXIST_EXAMPLE,
		},
	})
	@UsePipes(new ValidationPipe({ whitelist: true }))
	@Post('register')
	async register(@Body() dto: RegisterDto) {
		const oldUser = await this.authService.findUser(dto.login);
		if (oldUser) {
			throw new BadRequestException(ALREADY_REGISTERED_ERROR);
		}

		const user = await this.authService.createUser(dto);

		const { accessToken, refreshToken } =
			await this.authService.generateTokens(user);
		await this.authService.updateHashedRefreshToken(user.id, refreshToken);
		return {
			access_token: accessToken,
			refresh_token: refreshToken,
		};
	}

	@ApiOperation({
		summary: 'send your password and email as login in the request body',
	})
	@ApiBody({
		description: 'JSON with login and password for Login',
		type: AuthDto,
	})
	@ApiResponse({
		status: 200,
		description: 'User successfully logged in',
		example: USER_ACCESS_TOKEN_AND_REFRESH_TOKEN_EXAMPLE,
	})
	@ApiResponse({
		status: 400,
		description: 'Unauthorized or incorrect property',
		examples: {
			USER_NOT_FOUND_ERROR: USER_NOT_FOUND_EXAMPLE,
			PROPERTY_SHOULD_NOT_EXIST: PROPERTY_SHOULD_NOT_EXIST_EXAMPLE,
		},
	})
	@ApiResponse({
		status: 401,
		description: 'Invalid password',
		examples: {
			WRONG_PASSWORD_ERROR: INVALID_PASSWORD_EXAMPLE,
		},
	})
	@UsePipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }))
	@HttpCode(200)
	@Post('login')
	async login(@Body() dto: AuthDto) {
		const user = await this.authService.validateUser(dto);

		return await this.authService.login(user);
	}

	// -------------------------------- Посмотреть на необходимость наличия этого ендпоинта
	@ApiOperation({
		summary:
			'Send your access_token as a BEARER token to headers authorization to get user profile',
	})
	@ApiResponse({
		status: 200,
		description: 'Getting user profile',
		example: USER_PROFILE_EXAMPLE,
	})
	@ApiResponse({
		status: 401,
		description: UNAUTHORIZED_ERROR,
		example: UNAUTHORIZED_EXAMPLE,
	})
	@UseGuards(JwtAuthGuard)
	@ApiBearerAuth('access_token')
	@Get('profile')
	getProfile(@Req() req) {
		return this.authService.getProfile(req.user.id);
	}

	@ApiOperation({
		summary:
			'Send old refresh_token as a BEARER token to headers authorization to get new access token and refresh token',
	})
	@ApiResponse({
		status: 201,
		description: 'Get new access and refresh token',
		example: USER_ACCESS_TOKEN_AND_REFRESH_TOKEN_EXAMPLE,
	})
	@ApiResponse({
		status: 401,
		description: UNAUTHORIZED_ERROR,
		example: UNAUTHORIZED_EXAMPLE,
	})
	@UseGuards(RefreshAuthGuard)
	@ApiBearerAuth('refresh_token')
	@Post('refresh')
	refresh(@Req() req) {
		return this.authService.refreshToken(req.user.id);
	}

	@ApiOperation({
		summary:
			'Send the access_token as a BEARER token for authorization headers to log out of the account',
	})
	@ApiResponse({
		status: 200,
		description: 'Log out',
	})
	@ApiResponse({
		status: 401,
		description: UNAUTHORIZED_ERROR,
		example: UNAUTHORIZED_EXAMPLE,
	})
	@UseGuards(JwtAuthGuard)
	@ApiBearerAuth('access_token')
	@HttpCode(200)
	@Post('signout')
	signOut(@Req() req) {
		this.authService.signOut(req.user.id);
	}

	// ------------------------- Роут для входа и регистрации через GOOGLE
	@ApiOperation({
		summary: 'Endpoint for registration and login using google account',
	})
	@UseGuards(GoogleAuthGuard)
	@Get('google/login')
	googleLogin() {}

	@ApiOperation({
		summary:
			'Endpoint to which redirection will occur after Google confirms the login. It will receive all the necessary data, create a user and redirect to the client page with the addition of searchParameters',
	})
	@UseGuards(GoogleAuthGuard)
	@Get('google/callback')
	async googleCallback(@Req() req, @Res() res) {
		const response = await this.authService.login(req.user);

		res.redirect(
			`${this.clientConfiguration.clientURL}/login?access_token=${response.access_token}&refresh_token=${response.refresh_token}`,
		);
	}

	// ---------------------- тестовый вариант, передача токена как защещенные cookie ({ passthrough: true } и httpOnly: true) к которому нет доступа из js но
	// ------------------------------ он автоматически добавляеться к каждлму запросу. Если оставить этот пожход то изменить и другие ендпоинты (register, login, refresh), убрать у них отправку
	// ------------------------------- токенов в теле запроса и добавить отправку токенов в cookie
	// @UseGuards(GoogleAuthGuard)
	// @Get('google/callback')
	// async googleCallback(@Req() req, @Res({ passthrough: true }) res: Response) {
	// 	const response = await this.authService.login(req.user);

	// 	// Устанавливаем куки с токенами
	// 	res.cookie('access_token', response.access_token, {
	// 		httpOnly: true,
	// 		secure: true,
	// 		sameSite: 'lax',
	// 		expires: new Date(Date.now() + 3600000), // Срок жизни access_token
	// 	});

	// 	res.cookie('refresh_token', response.refresh_token, {
	// 		httpOnly: true,
	// 		secure: true,
	// 		sameSite: 'lax',
	// 		expires: new Date(Date.now() + 7 * 24 * 3600000), // Срок жизни refresh_token
	// 	});

	// 	// Редирект без токенов в URL
	// 	res.redirect(`${this.clientConfiguration.clientURL}/profile`);
	// }
}
