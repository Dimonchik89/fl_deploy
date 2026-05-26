import { registerAs } from '@nestjs/config';

export default registerAs('client-url', () => ({
	clientURL: process.env.CLIENT_URL,
}));
