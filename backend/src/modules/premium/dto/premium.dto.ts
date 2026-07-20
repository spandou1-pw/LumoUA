import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsIn, IsOptional, IsString, IsUUID, Length } from 'class-validator';

const CATEGORIES = [
  'badge',
  'frame',
  'theme',
  'username_color',
  'wallpaper',
  'profile_effect',
  'banner',
  'status_icon',
] as const;

export class SelectCosmeticDto {
  @ApiProperty({ enum: CATEGORIES })
  @IsIn(CATEGORIES)
  category: (typeof CATEGORIES)[number];

  @ApiProperty()
  @IsUUID()
  cosmeticItemId: string;
}

export class UpdateProfileExtrasDto {
  @ApiPropertyOptional({ maxLength: 60 })
  @IsOptional()
  @IsString()
  @Length(0, 60)
  statusText?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  statusEmoji?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  animatedProfileEnabled?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  videoAvatarAssetId?: string;
}

export class ReactDto {
  @ApiProperty({ enum: ['post', 'comment', 'message'] })
  @IsIn(['post', 'comment', 'message'])
  targetType: 'post' | 'comment' | 'message';

  @ApiProperty()
  @IsUUID()
  targetId: string;

  @ApiProperty()
  @IsString()
  emoji: string;
}

export class CreateCosmeticItemDto {
  @ApiProperty({ enum: CATEGORIES })
  @IsIn(CATEGORIES)
  category: (typeof CATEGORIES)[number];

  @ApiProperty()
  @IsString()
  name: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  assetUrl?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  isAnimated?: boolean;

  @ApiPropertyOptional({ default: true })
  @IsOptional()
  @IsBoolean()
  requiresPremium?: boolean;
}
