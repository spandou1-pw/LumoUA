import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsDateString, IsIn, IsInt, IsOptional, IsString, IsUUID, Min } from 'class-validator';

export class CreateGiftCategoryDto {
  @ApiProperty()
  @IsString()
  name: string;

  @ApiProperty()
  @IsString()
  slug: string;
}

export class CreateGiftCatalogItemDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  categoryId?: string;

  @ApiProperty()
  @IsString()
  name: string;

  @ApiProperty()
  @IsInt()
  @Min(1)
  coinCost: number;

  @ApiProperty()
  @IsString()
  iconUrl: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  animationUrl?: string;

  @ApiPropertyOptional({ default: false })
  @IsOptional()
  @IsBoolean()
  isAnimated?: boolean;

  @ApiPropertyOptional({ enum: ['common', 'rare', 'legendary'], default: 'common' })
  @IsOptional()
  @IsIn(['common', 'rare', 'legendary'])
  rarity?: 'common' | 'rare' | 'legendary';

  @ApiPropertyOptional({ description: 'Fixed stock for a Limited Gift — omit for unlimited' })
  @IsOptional()
  @IsInt()
  @Min(1)
  totalSupply?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  seasonTag?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  availableFrom?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  availableUntil?: string;
}
