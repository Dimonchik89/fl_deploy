import { Post } from '../entities/post.entity';

export interface PostSuccess {
	statusCode: number;
	message: string;
}

export interface FindAllPostResponse {
	count: number;
	rows: Post[];
}

export interface PostImage {
	title: string;
	src: string;
}
