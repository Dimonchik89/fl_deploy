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
import { File } from './file.entity';
import { Role } from '../auth/enums/role.enum';
import { DataTypes } from 'sequelize';
import { SubscriptionEnum } from 'src/stripe/stripe.types';
import { Referrals } from './referrals.entity';

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
		type: DataTypes.ENUM(...Object.values(Role)),
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

	@Column
	maxFolderSize: number;

	@AllowNull(true)
	@Column
	stripeCustomerId: string;

	@Column
	subscriptionId: string;

	@Column
	referralCode: string;

	@Column
	referredById: string | null;

	// @HasMany(() => File, { onDelete: 'CASCADE' })
	// @HasMany(() => File)
	// userFiles: File[];

	@HasMany(() => Referrals, 'referrerId')
	referralsSent: Referrals[];

	@HasMany(() => Referrals, 'refereeId')
	referralReceived: Referrals;
}
