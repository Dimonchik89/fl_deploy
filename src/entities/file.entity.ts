import {
	AllowNull,
	BelongsTo,
	Column,
	DataType,
	ForeignKey,
	Model,
	PrimaryKey,
	Table,
} from 'sequelize-typescript';
import { User } from './user.entity';

@Table
export class File extends Model {
	@PrimaryKey
	@Column({
		type: DataType.UUID,
		defaultValue: DataType.UUIDV4,
	})
	id: string;

	@AllowNull(false)
	@Column
	filePath: string;

	@AllowNull(false)
	@Column
	fileExt: string;

	@AllowNull(false)
    @Column
    fileName: string; 

	@AllowNull(false)
    @Column
    originalName: string; 

	@AllowNull(false)
    @Column(DataType.BIGINT)
    size: number;

	@BelongsTo(() => User)
	user: User;

	@ForeignKey(() => User)
	@Column({
		type: DataType.UUID,
		allowNull: false,
	})
	userId: string;
}
