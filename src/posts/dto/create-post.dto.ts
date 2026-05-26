import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class CreatePostDto {
	// @ApiProperty({ example: 'My post' })
	// @IsString()
	// title: string;

	// @ApiProperty({ example: 'Main text' })
	// @IsString()
	// text: string;

	// @ApiProperty({ example: 'https://example.com' })
	// @IsOptional()
	// link: string;

	// @ApiProperty({ example: 'Optional subtitle', required: false })
	// @IsOptional()
	// subtitle?: string;

	// @ApiProperty({ example: 'Optional Text', required: false })
	// @IsOptional()
	// subtext?: string;

	// @ApiProperty({ example: 'Optional Link', required: false })
	// @IsOptional()
	// additionalLink?: string;

	@ApiProperty({
		example: `
            <div>
                <h2>Title</h2>
                <p>Text</p>
                <img src="image_link" alt="image description"/>
            </div>
        `,
	})
	@IsString()
	contentHtml: string;
}
