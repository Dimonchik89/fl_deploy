import {
	Table,
	Model,
	PrimaryKey,
	DataType,
	Column,
	HasMany,
} from 'sequelize-typescript';
import { PostImage } from '../posts/post.types';

@Table
export class Post extends Model {
	@PrimaryKey
	@Column({
		type: DataType.UUID,
		defaultValue: DataType.UUIDV4,
	})
	id: string;

	@Column(DataType.TEXT)
	contentHtml: string;
}
