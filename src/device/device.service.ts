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

@Injectable()
export class DeviceService {
	constructor(
		@Inject('DEVICE_REPOSITORY') private deviceRepository: typeof Device,
		@Inject('USER_REPOSITORY') private userRepository: typeof User,
	) {}

	async create(userId: string, { serialNumber }: CreateDeviceDto) {
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
		return newDevice;
	}

	async findAll() {
		return await this.deviceRepository.findAndCountAll();
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
