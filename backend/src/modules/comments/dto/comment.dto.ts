import { ApiProperty } from '@nestjs/swagger';
import { Length } from 'class-validator';

export class CreateCommentDto {
  @ApiProperty({ maxLength: 1000 })
  @Length(1, 1000)
  body: string;
}

export class CommentResponseDto {
  @ApiProperty() id: string;
  @ApiProperty() postId: string;
  @ApiProperty() authorId: string;
  @ApiProperty() body: string;
  @ApiProperty() createdAt: Date;
  @ApiProperty() likeCount: number;
  @ApiProperty() viewerHasLiked: boolean;
}
