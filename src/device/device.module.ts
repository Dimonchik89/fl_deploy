import { Module } from '@nestjs/common';
import { DeviceService } from './device.service';
import { DeviceController } from './device.controller';
import { deviceProviders } from './device.providers';
import { userProviders } from '../user/user.providers';

@Module({
	controllers: [DeviceController],
	providers: [DeviceService, ...deviceProviders, ...userProviders],
})
export class DeviceModule {}
