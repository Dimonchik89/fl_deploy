import { Device } from '../entities/device.entity';

export const deviceProviders = [
	{
		provide: 'DEVICE_REPOSITORY',
		useValue: Device,
	},
];
