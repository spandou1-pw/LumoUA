import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsIn, IsOptional, IsString, IsUUID, Length } from 'class-validator';

const TARGET_TYPES = ['post', 'comment', 'user', 'message', 'community', 'gift'] as const;
const REASONS = ['spam', 'harassment', 'hate_speech', 'illegal_content', 'impersonation', 'self_harm', 'other'] as const;

export class CreateReportDto {
  @ApiProperty({ enum: TARGET_TYPES })
  @IsIn(TARGET_TYPES)
  targetType: (typeof TARGET_TYPES)[number];

  @ApiProperty()
  @IsUUID()
  targetId: string;

  @ApiProperty({ enum: REASONS })
  @IsIn(REASONS)
  reason: (typeof REASONS)[number];

  @ApiPropertyOptional({ maxLength: 1000 })
  @IsOptional()
  @IsString()
  @Length(0, 1000)
  detail?: string;
}

export class ResolveReportDto {
  @ApiProperty({ enum: ['dismissed', 'actioned'] })
  @IsIn(['dismissed', 'actioned'])
  status: 'dismissed' | 'actioned';

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @Length(0, 1000)
  note?: string;
}
