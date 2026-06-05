import {
	Column,
	DataType,
	ForeignKey,
	Model,
	PrimaryKey,
	Table,
	BelongsTo,
} from 'sequelize-typescript';
import { User } from './user.entity';

@Table({ tableName: 'AuthCodes' })
export class AuthCode extends Model {
	@PrimaryKey
	@Column({
		type: DataType.UUID,
		defaultValue: DataType.UUIDV4,
	})
	id: string;

	@Column({
		type: DataType.STRING,
		allowNull: false,
		unique: true,
	})
	code: string;

	@ForeignKey(() => User)
	@Column({
		type: DataType.UUID,
		allowNull: false,
	})
	userId: string;

	@BelongsTo(() => User)
	user: User;

	@Column({
		type: DataType.DATE,
		allowNull: false,
	})
	expiresAt: Date;
}
