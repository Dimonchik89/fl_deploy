import { Inject, Injectable, BadRequestException } from '@nestjs/common';
import { CreatePostDto } from './dto/create-post.dto';
import { UpdatePostDto } from './dto/update-post.dto';
import { Post } from '../entities/post.entity';
import { join } from 'path';
import { path } from 'app-root-path';
import * as fsExtra from 'fs-extra';
import { v4 as uuidv4 } from 'uuid';
import { promises as fsPromises } from 'fs';
import { FindAllPostResponse, PostImage, PostSuccess } from './post.types';
import * as sanitizeHtml from 'sanitize-html';
import { NOT_FOUND } from '../app.constants';

@Injectable()
export class PostsService {
	constructor(@Inject('POST_REPOSITORY') private postRepository: typeof Post) {}

	async uploadArrayFiles({ files }: { files: Array<Express.Multer.File> }) {
		// const createdFiles: string[] = [];
		const createdFiles: Array<PostImage> = [];

		const uploadFolder = join(path, process.env.UPLOADS_BASE_PATH, 'posts');
		await fsExtra.ensureDir(uploadFolder);

		for (const file of files) {
			const { originalname, buffer, size } = file;

			const lastDotIndex = originalname.lastIndexOf('.');
			const fileExtPart =
				lastDotIndex !== -1 ? originalname.substring(lastDotIndex + 1) : '';

			const uniqueServerFileName = `${uuidv4()}.${fileExtPart}`;
			const fullFilePath = join(uploadFolder, uniqueServerFileName);

			try {
				await fsPromises.writeFile(fullFilePath, buffer);
				// createdFiles.push(join('posts', uniqueServerFileName));
				createdFiles.push({
					title: file.originalname,
					src: join('posts', uniqueServerFileName),
				});
			} catch (error) {
				throw new BadRequestException();
			}
		}

		return createdFiles;
	}

	async create(createPostDto: CreatePostDto): Promise<Post> {
		try {
			const cleanHtml = sanitizeHtml(createPostDto.contentHtml, {
				allowedTags: sanitizeHtml.defaults.allowedTags.concat([
					'img',
					'h1',
					'h2',
					'iframe',
				]),
				allowedAttributes: {
					'*': ['class', 'style'],
					a: ['href', 'target'],
					img: ['src', 'alt'],
				},
			});

			const createdPost = await this.postRepository.create({
				contentHtml: cleanHtml,
			});

			return createdPost;
		} catch (error) {
			throw new BadRequestException(error.message);
		}
	}

	async findAll({
		limit,
		page,
	}: {
		page?: string;
		limit?: string;
	}): Promise<FindAllPostResponse> {
		try {
			const postLimit = +limit || 8;
			const postPage = +page || 1;
			const postOffset = postPage * postLimit - postLimit;

			return await this.postRepository.findAndCountAll({
				limit: postLimit,
				offset: postOffset,
				order: [['createdAt', 'DESC']],
			});
		} catch (error) {
			throw new BadRequestException(error.message);
		}
	}

	async findOne(id: string): Promise<Post> {
		try {
			const post = await this.postRepository.findOne({ where: { id } });

			return post;
		} catch (error) {
			throw new BadRequestException(error.message);
		}
	}

	async update({
		id,
		updatePostDto,
	}: {
		id: string;
		updatePostDto: UpdatePostDto;
	}) {
		try {
			const oldPost = await this.postRepository.findOne({ where: { id } });

			if (!oldPost) {
				throw new BadRequestException(NOT_FOUND);
			}

			const [count, [updatedPost]] = await this.postRepository.update(
				{
					...updatePostDto,
				},
				{ where: { id }, returning: true },
			);

			return updatedPost;
		} catch (error) {
			throw new BadRequestException(error.message);
		}
	}

	async remove(id: string): Promise<PostSuccess> {
		try {
			const post = await this.postRepository.findOne({ where: { id } });

			if (!post) {
				throw new BadRequestException('Post not found');
			}

			await this.postRepository.destroy({ where: { id } });
			return {
				statusCode: 200,
				message: `The post ${id} was deleted`,
			};
		} catch (error) {
			throw new BadRequestException(error.message);
		}
	}

	async deletePostImageArray(arrayPath: PostImage[]) {
		try {
			arrayPath.forEach(async ({ src }) => {
				const path = join(__dirname, '..', '..', 'uploads', src);
				await fsExtra.remove(path);
			});
		} catch (error) {
			throw new BadRequestException(error.message);
		}
	}
}
