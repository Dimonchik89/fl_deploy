import {
	BelongsTo,
	Column,
	DataType,
	Default,
	ForeignKey,
	HasMany,
	Model,
	PrimaryKey,
	Table,
} from 'sequelize-typescript';
import { User } from './user.entity';

@Table
export class Referrals extends Model {
	@PrimaryKey
	@Column({
		type: DataType.UUID,
		defaultValue: DataType.UUIDV4,
	})
	id: string;

	// хто запросив
	@ForeignKey(() => User)
	@Column({ type: DataType.UUID, allowNull: false })
	referrerId: string;

	@BelongsTo(() => User, 'referrerId')
	referrer: User;

	// кого запросили
	@ForeignKey(() => User)
	@Column({ type: DataType.UUID, allowNull: false, unique: true })
	refereeId: string;

	@BelongsTo(() => User, 'refereeId')
	referee: User;

	@Default('pending')
	@Column(DataType.ENUM('pending', 'converted')) // pending - тiльки реестрацiя, converted - оплатив пiдписку
	status: string;

	@Default(false)
	@Column(DataType.BOOLEAN)
	bonusApplied: boolean;
}
