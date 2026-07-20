import { ApiPropertyOptional, ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString, IsUUID, Length } from 'class-validator';

export class SendGiftDto {
  @ApiProperty()
  @IsUUID()
  recipientId: string;

  @ApiProperty()
  @IsUUID()
  giftCatalogItemId: string;

  @ApiPropertyOptional({ maxLength: 200 })
  @IsOptional()
  @IsString()
  @Length(0, 200)
  message?: string;

  @ApiPropertyOptional({ enum: ['post', 'comment', 'profile'] })
  @IsOptional()
  @IsString()
  contextType?: 'post' | 'comment' | 'profile';

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  contextId?: string;
}
