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
import { ExchangeCodeDto } from './dto/exchange-code.dto';

@ApiTags('Auth')
@ApiResponse({ status: 500, description: 'Internal server error.' })
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
	@ApiBearerAuth()
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
		return this.authService.refreshToken(req.user);
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
	@ApiBearerAuth()
	@HttpCode(200)
	@Post('signout')
	signOut(@Req() req) {
		this.authService.signOut(req.user.id);
	}

	// ------------------------- Роут для входа и регистрации через GOOGLE
	@ApiOperation({
		summary: 'Endpoint for registration and login using google account',
	})
	@ApiOperation({
		summary: 'Google OAuth Login Entry Point',
		description:
			'Redirects the user to Google Login page. \n\n' +
			'**Desktop App (Python) usage:** Append `?state=desktop` to the URL to ensure redirection back to `http://localhost:5000`. \n\n' +
			'**Web App usage:** Default behavior, redirects back to the configured Client URL.',
	})
	@UseGuards(GoogleAuthGuard)
	@Get('google/login')
	googleLogin() {}

	@ApiOperation({
		summary: 'Google OAuth Callback (Internal)',
		description:
			'Endpoint where Google redirects the user after authentication. \n\n' +
			'1. Generates a short-lived (60s) temporary exchange code. \n' +
			'2. Redirects the user back to the platform: \n' +
			'   - **Desktop:** `http://localhost:5000/callback?code={tempCode}` (if state=desktop was used) \n' +
			'   - **Web:** `{CLIENT_URL}/login?code={tempCode}` (default)',
	})
	@UseGuards(GoogleAuthGuard)
	@Get('google/callback')
	async googleCallback(@Req() req, @Res() res) {
		const tempCode = await this.authService.generateAuthCode(req.user.id);

		// // Проверяем, откуда пришел пользователь (через параметр state в OAuth)
		const isDesktop = req.query.state === 'desktop';
		const redirectUrl = isDesktop
			? `http://localhost:5000/callback?code=${tempCode}`
			: `${this.clientConfiguration.clientURL}/login?code=${tempCode}`;

		res.redirect(redirectUrl);
	}

	@ApiOperation({
		summary: 'Exchange temporary code for JWT tokens',
		description:
			'After receiving a `code` via redirect (from Google OAuth), the client (Web or Desktop) must call this endpoint to receive the final Access and Refresh tokens. \n\n' +
			'The code is one-time use and expires in 60 seconds.',
	})
	@ApiBody({ type: ExchangeCodeDto })
	@ApiResponse({
		status: 200,
		description: 'Tokens successfully generated',
		example: USER_ACCESS_TOKEN_AND_REFRESH_TOKEN_EXAMPLE,
	})
	@ApiResponse({
		status: 401,
		description: 'Invalid or expired temporary code',
	})
	@Post('exchange-code')
	@HttpCode(200)
	async exchangeCode(@Body() body: ExchangeCodeDto) {
		return this.authService.exchangeCode(body?.code);
	}
}
