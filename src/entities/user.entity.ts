import {
	AllowNull,
	Column,
	DataType,
	Default,
	HasMany,
	HasOne,
	Model,
	PrimaryKey,
	Table,
} from 'sequelize-typescript';
import { Role } from '../auth/enums/role.enum';
import { SubscriptionEnum } from 'src/stripe/stripe.types';
import { Referrals } from './referrals.entity';
import { Device } from './device.entity';

@Table
export class User extends Model {
	@PrimaryKey
	@Column({
		type: DataType.UUID,
		defaultValue: DataType.UUIDV4,
	})
	id: string;

	@AllowNull(false)
	@Column({ unique: true })
	email: string;

	@AllowNull(false)
	@Column
	passwordHash: string;

	@Column({
		type: DataType.ENUM(...Object.values(Role)),
		allowNull: false,
		defaultValue: Role.USER,
	})
	role: Role;

	@Column({ allowNull: true })
	hashedRefreshToken: string;

	@AllowNull(false)
	@Default(SubscriptionEnum.free)
	@Column
	subscription: string;

	@AllowNull(true)
	@Column
	stripeCustomerId: string;

	@AllowNull(true)
	@Column
	subscriptionId: string;

	@AllowNull(true)
	@Column
	referralCode: string;

	@AllowNull(true)
	@Column({ type: DataType.UUID })
	referredById: string | null;

	@HasMany(() => Referrals, 'referrerId')
	referralsSent: Referrals[];

	@HasOne(() => Referrals, 'refereeId')
	referralReceived: Referrals;

	@HasMany(() => Device)
	devices: Device[];
}

// referralsSent — это список тех, кого пригласили вы.
// referralReceived — это запись о том, кто пригласил вас.
