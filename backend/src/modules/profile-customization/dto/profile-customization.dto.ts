import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsIn, IsString, IsUUID } from 'class-validator';

export class CreateAchievementDto {
  @ApiProperty()
  @IsString()
  key: string;

  @ApiProperty()
  @IsString()
  name: string;

  @ApiProperty()
  @IsString()
  description: string;

  @ApiProperty()
  @IsString()
  iconUrl: string;

  @ApiPropertyOptional({ enum: ['bronze', 'silver', 'gold', 'platinum'], default: 'bronze' })
  @IsIn(['bronze', 'silver', 'gold', 'platinum'])
  tier: 'bronze' | 'silver' | 'gold' | 'platinum';
}

export class GrantAchievementDto {
  @ApiProperty()
  @IsUUID()
  userId: string;

  @ApiProperty()
  @IsString()
  achievementKey: string;
}
