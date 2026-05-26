import { Module } from '@nestjs/common';
import { PostsService } from './posts.service';
import { PostsController } from './posts.controller';
import { postProviders } from './post.provider';

@Module({
	controllers: [PostsController],
	providers: [PostsService, ...postProviders],
})
export class PostsModule {}
