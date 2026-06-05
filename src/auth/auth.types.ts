import { Role } from './enums/role.enum';

export interface TokeInterface {
	id: string;
	email: string;
	stripeCustomerId: string;
	subscription: string;
	role: Role;
}
