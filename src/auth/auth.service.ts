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

@Injectable()
export class AuthService {
	constructor(
		@Inject('USER_REPOSITORY') private userRepository: typeof User,
		@Inject(refreshJwtConfig.KEY)
		private refreshTokenConfig: ConfigType<typeof refreshJwtConfig>,
		private jwtService: JwtService,
		@Inject(forwardRef(() => StripeService))
		private readonly stripeService: StripeService,
		@Inject('REFERRALS_REPOSITORY')
		private referralsRepository: typeof Referrals,
	) {}

	async updateHashedRefreshToken(userId: string, refreshToken: string) {
		const hashedRefreshToken = await argon2.hash(refreshToken);

		console.log('updateHashedRefreshToken', userId, refreshToken);

		return await this.userRepository.update(
			{ hashedRefreshToken },
			{ where: { id: userId } },
		);
	}

	async findUser(login: string): Promise<User> {
		return this.userRepository.findOne<User>({ where: { email: login } });
	}

	async createUser(dto: RegisterDto): Promise<TailUserForToken> {
		const salt = await genSalt(10);
		const customerId = await this.stripeService.createStripeCustomer(dto.login);

		const newUser = await this.userRepository.create({
			email: dto.login,
			passwordHash: await hash(dto.password, salt),
			subscription: SubscriptionEnum.free,
			maxFolderSize: 50,
			role: dto.role,
			stripeCustomerId: customerId,
			referralCode: uuidv4(),
		});

		const tailUser = {
			id: newUser.id,
			email: newUser.email,
			subscription: newUser.subscription,
			stripeCustomerId: newUser.stripeCustomerId,
			role: newUser.role,
		};
		return tailUser;
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
	async refreshToken(userId: string) {
		const { id, email, subscription, stripeCustomerId, role } =
			await this.userRepository.findOne({
				where: { id: userId },
			});

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
	): Promise<{ id: string; email: string }> {
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
}
