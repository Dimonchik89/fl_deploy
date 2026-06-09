import { Module } from '@nestjs/common';
import { DeviceService } from './device.service';
import { DeviceController } from './device.controller';
import { deviceProviders } from './device.providers';
import { userProviders } from '../user/user.providers';
import { DatabaseModule } from '../database/database.module';

@Module({
	imports: [DatabaseModule],
	controllers: [DeviceController],
	providers: [DeviceService, ...deviceProviders, ...userProviders],
})
export class DeviceModule {}
