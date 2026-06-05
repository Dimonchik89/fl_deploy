import {
	Inject,
	Injectable,
	InternalServerErrorException,
	NotFoundException,
	UnauthorizedException,
	forwardRef,
} from '@nestjs/common';
import { AuthDto, RegisterDto } from './dto/auth.dto';
import { hash, genSalt, compare } from 'bcryptjs';
import {
	INVALID_TOKEN_ERROR,
	USER_EMAIL_NOT_FOUND_ERROR,
	WRONG_PASSWORD_ERROR,
} from './auth.constants';
import { JwtService } from '@nestjs/jwt';
import {
	TailUserForToken,
	UserAccessToken,
	UserAccessTokenAndRefreshToken,
} from '../user/user.types';
import { User } from '../entities/user.entity';
import refreshJwtConfig from './config/refresh-jwt-config';
import { ConfigType } from '@nestjs/config';
import * as argon2 from 'argon2';
import { SubscriptionEnum } from 'src/stripe/stripe.types';
import { path } from 'app-root-path';
import { promises as fsPromises } from 'fs';
import { join } from 'path';
import { StripeService } from '../stripe/stripe.service';
import { v4 as uuidv4 } from 'uuid';
import { Referrals } from '../entities/referrals.entity';
import { Logger } from '@nestjs/common';
import { Sequelize } from 'sequelize-typescript';
import { AuthCode } from '../entities/auth-code.entity';
import { Op } from 'sequelize';

import { Role } from './enums/role.enum';
import { TokeInterface } from './auth.types';

@Injectable()
export class AuthService {
	private readonly logger = new Logger(AuthService.name);

	constructor(
		@Inject('USER_REPOSITORY') private userRepository: typeof User,
		@Inject('AUTH_CODE_REPOSITORY') private authCodeRepository: typeof AuthCode,
		@Inject(refreshJwtConfig.KEY)
		private refreshTokenConfig: ConfigType<typeof refreshJwtConfig>,
		private jwtService: JwtService,
		@Inject(forwardRef(() => StripeService))
		private readonly stripeService: StripeService,
		@Inject('REFERRALS_REPOSITORY')
		private referralsRepository: typeof Referrals,
		@Inject('SEQUELIZE') private readonly sequelize: Sequelize,
	) {}

	async updateHashedRefreshToken(userId: string, refreshToken: string) {
		const hashedRefreshToken = await argon2.hash(refreshToken);

		this.logger.log(`Updated hashed refresh token for user ${userId}`);

		return await this.userRepository.update(
			{ hashedRefreshToken },
			{ where: { id: userId } },
		);
	}

	async findUser(login: string): Promise<User> {
		return this.userRepository.findOne<User>({ where: { email: login } });
	}

	async createUser(dto: RegisterDto): Promise<TailUserForToken> {
		const transaction = await this.sequelize.transaction();
		try {
			const salt = await genSalt(10);
			const customerId = await this.stripeService.createStripeCustomer(
				dto.login,
			);

			const newUser = await this.userRepository.create(
				{
					email: dto.login,
					passwordHash: await hash(dto.password, salt),
					subscription: SubscriptionEnum.free,
					role: Role.USER,
					stripeCustomerId: customerId,
					referralCode: uuidv4(),
				},
				{ transaction },
			);

			await transaction.commit();

			return {
				id: newUser.id,
				email: newUser.email,
				subscription: newUser.subscription,
				stripeCustomerId: newUser.stripeCustomerId,
				role: newUser.role,
			};
		} catch (error) {
			await transaction.rollback();
			this.logger.error(`Failed to create user: ${error.message}`);
			throw new InternalServerErrorException('Error during user registration');
		}
	}

	async validateUser(dto: AuthDto): Promise<TailUserForToken> {
		const user = await this.findUser(dto.login);
		if (!user) {
			throw new UnauthorizedException(USER_EMAIL_NOT_FOUND_ERROR);
		}

		const isCorrectPassword = await compare(dto.password, user.passwordHash);
		if (!isCorrectPassword) {
			throw new UnauthorizedException(WRONG_PASSWORD_ERROR);
		}

		return {
			id: user.id,
			email: user.email,
			subscription: user.subscription,
			stripeCustomerId: user.stripeCustomerId,
			role: user.role,
		};
	}

	async login(user: TailUserForToken): Promise<UserAccessTokenAndRefreshToken> {
		const { accessToken, refreshToken } = await this.generateTokens(user);
		await this.updateHashedRefreshToken(user.id, refreshToken);

		return {
			access_token: accessToken,
			refresh_token: refreshToken,
		};
	}

	async generateTokens(user: TailUserForToken) {
		const [accessToken, refreshToken] = await Promise.all([
			this.jwtService.signAsync(user),
			this.jwtService.signAsync(user, this.refreshTokenConfig),
		]);

		return {
			accessToken,
			refreshToken,
		};
	}

	// -------------------------------- Посмотреть на необходимость наличия этой функции, возможно оставить refresh
	// async isAuth(bearerToken: string) {
	// 	const token = bearerToken.split(' ').pop();
	// 	const user = await this.jwtService.decode(token);

	// 	if (!user) {
	// 		throw new UnauthorizedException(INVALID_TOKEN_ERROR);
	// 	}
	// 	return {
	// 		access_token: await this.jwtService.signAsync({
	// 			id: user.id,
	// 			email: user.email,
	// 			subscription: user.subscription,
	// 			stripeCustomerId: user.stripeCustomerId,
	// 		}),
	// 	};
	// }

	// -------------------------------- Посмотреть на необходимость наличия этой функции
	async getProfile(userId: string) {
		const { id, email, subscription, stripeCustomerId, role, referralCode } =
			await this.userRepository.findOne({
				where: { id: userId },
			});

		// const maxFolderSizeBytes = maxFolderSize * 1024 * 1024;

		// const uploadFolder = join(path, process.env.UPLOADS_BASE_PATH, email);
		// let currentTotalFolderSize = 0;

		// try {
		// 	const existingFileNames = await fsPromises.readdir(uploadFolder);
		// 	for (const fileName of existingFileNames) {
		// 		const filePath = join(uploadFolder, fileName);
		// 		const stat = await fsPromises.stat(filePath);
		// 		currentTotalFolderSize += stat.size;
		// 	}
		// } catch (error) {
		// 	throw new InternalServerErrorException(
		// 		'We cannot retrieve storage size information.',
		// 	);
		// }

		return {
			id,
			email,
			subscription,
			stripeCustomerId,
			role,
			referralCode,
			// maxFolderSize: maxFolderSizeBytes,
			// currentTotalFolderSize,
		};
	}

	// -------------------------------- Посмотреть на необходимость наличия этой функции
	async refreshToken({
		id,
		email,
		role,
		stripeCustomerId,
		subscription,
	}: TokeInterface) {
		// const { id, email, subscription, stripeCustomerId, role } =
		// 	await this.userRepository.findOne({
		// 		where: { id: userId },
		// 	});

		const { accessToken, refreshToken } = await this.generateTokens({
			id,
			email,
			subscription,
			stripeCustomerId,
			role,
		});

		await this.updateHashedRefreshToken(id, refreshToken);

		return {
			access_token: accessToken,
			refresh_token: refreshToken,
		};
	}

	async validateRefreshToken(
		userId: string,
		refreshToken: string,
	): Promise<TokeInterface> {
		const user = await this.userRepository.findOne({ where: { id: userId } });

		if (!user || !user.hashedRefreshToken) {
			throw new UnauthorizedException(INVALID_TOKEN_ERROR);
		}

		const refreshTokenMatches = await argon2.verify(
			user.hashedRefreshToken,
			refreshToken,
		);

		if (!refreshTokenMatches) {
			throw new UnauthorizedException(INVALID_TOKEN_ERROR);
		}

		return {
			id: user.id,
			email: user.email,
			stripeCustomerId: user.stripeCustomerId,
			subscription: user.subscription,
			role: user.role,
		};
	}

	async signOut(userId: string) {
		// await this.updateHashedRefreshToken(userId, null);
		await this.userRepository.update(
			{ hashedRefreshToken: null },
			{ where: { id: userId } },
		);
	}

	async validateGoogleUser(googleUser: RegisterDto) {
		const user = await this.userRepository.findOne({
			where: { email: googleUser.login },
		});

		if (user) return user;

		const newUser = await this.createUser({
			login: googleUser.login,
			password: googleUser.password,
		});

		return newUser;
	}

	async generateAuthCode(userId: string): Promise<string> {
		const code = uuidv4();
		const expiresAt = new Date(Date.now() + 60 * 1000); // Код живет 60 секунд

		await this.authCodeRepository.create({
			code,
			userId,
			expiresAt,
		});

		return code;
	}

	async exchangeCode(code: string): Promise<UserAccessTokenAndRefreshToken> {
		const authCode = await this.authCodeRepository.findOne({
			where: {
				code,
				expiresAt: {
					[Op.gt]: new Date(),
				},
			},
			include: [User],
		});

		if (!authCode) {
			throw new UnauthorizedException('Invalid or expired temporary code');
		}

		const user = authCode.user;

		// Удаляем код после использования (одноразовый)
		await authCode.destroy();

		const tailUser: TailUserForToken = {
			id: user.id,
			email: user.email,
			subscription: user.subscription,
			stripeCustomerId: user.stripeCustomerId,
			role: user.role as Role,
		};

		return this.login(tailUser);
	}
}
