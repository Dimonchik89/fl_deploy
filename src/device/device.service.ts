import {
	BadRequestException,
	Inject,
	Injectable,
	NotFoundException,
} from '@nestjs/common';
import { CreateDeviceDto } from './dto/create-device.dto';
import { UpdateDeviceDto } from './dto/update-device.dto';
import { Device } from '../entities/device.entity';
import { User } from '../entities/user.entity';
import { PaginationParamsDto } from './dto/pagination-params.dto';
import { Sequelize } from 'sequelize-typescript';

@Injectable()
export class DeviceService {
	constructor(
		@Inject('DEVICE_REPOSITORY') private deviceRepository: typeof Device,
		@Inject('USER_REPOSITORY') private userRepository: typeof User,
		@Inject('SEQUELIZE') private readonly sequelize: Sequelize,
	) {}

	async create(userId: string, { serialNumber }: CreateDeviceDto) {
		const transaction = await this.sequelize.transaction();

		try {
			const existingDevice = await this.deviceRepository.findOne({
				where: { serialNumber },
			});

			if (existingDevice) {
				if (existingDevice.userId === userId) {
					return existingDevice;
				}
				throw new BadRequestException(
					'This device is already registered to another account.',
				);
			}

			const user = await this.userRepository.findOne({
				where: {
					id: userId,
				},
				include: ['devices'],
			});

			if (!user) {
				throw new BadRequestException('No user with this ID was found');
			}

			if (user.devices.length >= 2) {
				throw new BadRequestException(
					'This user already has the maximum number of devices registered (2 devices)',
				);
			}

			const newDevice = await this.deviceRepository.create({
				serialNumber,
				userId,
			});
			await transaction.commit();
			return newDevice;
		} catch (error) {
			if (transaction) await transaction.rollback();
			throw error;
		}
	}

	async findAll(params: PaginationParamsDto) {
		const currentPage = +params.page || 1;
		const collectionLimit = Number(params.limit) || 10;
		const offset = (Number(currentPage) - 1) * Number(collectionLimit);

		return await this.deviceRepository.findAndCountAll({
			order: [['createdAt', 'DESC']],
			limit: collectionLimit,
			offset,
		});
	}

	async remove({ deviceId, userId }: { deviceId: string; userId: string }) {
		const device = await this.deviceRepository.findOne({
			where: {
				id: deviceId,
				userId,
			},
		});

		if (!device) {
			throw new NotFoundException('Device not found');
		}

		await this.deviceRepository.destroy({ where: { id: deviceId } });
		return {
			statusCode: 200,
			message: `The device ${deviceId} was deleted`,
		};
	}
}
