import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ArrayMaxSize, IsArray, IsIn, IsOptional, IsUUID, Length } from 'class-validator';

export class CreatePostDto {
  @ApiPropertyOptional({ maxLength: 2000 })
  @IsOptional()
  @Length(0, 2000)
  body?: string;

  @ApiPropertyOptional({ enum: ['default', 'public', 'followers'], default: 'default' })
  @IsOptional()
  @IsIn(['default', 'public', 'followers'])
  visibility?: 'default' | 'public' | 'followers';

  @ApiPropertyOptional({
    type: [String],
    description: 'Media asset IDs from a prior POST /media/upload-url + confirm, in carousel order',
    maxItems: 10,
  })
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(10)
  @IsUUID('4', { each: true })
  mediaAssetIds?: string[];
}

export class UpdatePostDto {
  @ApiPropertyOptional({ maxLength: 2000 })
  @IsOptional()
  @Length(0, 2000)
  body?: string;
}

export class PostResponseDto {
  @ApiProperty() id: string;
  @ApiProperty() authorId: string;
  @ApiPropertyOptional() body: string | null;
  @ApiProperty() visibility: string;
  @ApiProperty() createdAt: Date;
  @ApiProperty() likeCount: number;
  @ApiProperty() commentCount: number;
  @ApiProperty() viewerHasLiked: boolean;
  @ApiProperty() viewerHasBookmarked: boolean;
}
