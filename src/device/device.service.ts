import { BadRequestException, Inject, Injectable } from '@nestjs/common';
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

	async create({ userId, serialNumber }: CreateDeviceDto) {
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

		const deviceExists = await this.deviceRepository.findOne({
			where: {
				serialNumber,
			},
		});

		if (!!deviceExists) {
			throw new BadRequestException(
				'This device is already registered to another account.',
			);
		}

		const newDevice = await this.deviceRepository.create({
			serialNumber,
			userId,
		});
	}

	findAll() {
		return `This action returns all device`;
	}

	findOne(id: number) {
		return `This action returns a #${id} device`;
	}

	update(id: number, updateDeviceDto: UpdateDeviceDto) {
		return `This action updates a #${id} device`;
	}

	remove(id: number) {
		return `This action removes a #${id} device`;
	}
}
