import { IsIn, IsOptional, IsString } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

/**
 * Common filter/sort query shape. Feature modules extend this rather than
 * inventing their own filter param names, so client code (and API docs)
 * stay consistent across endpoints (doc 40 coding-standards consistency rule).
 */
export class BaseFilterQueryDto {
  @ApiPropertyOptional({ enum: ['newest', 'oldest'], default: 'newest' })
  @IsOptional()
  @IsIn(['newest', 'oldest'])
  sort?: 'newest' | 'oldest' = 'newest';

  @ApiPropertyOptional({ description: 'Free-text filter, matched server-side per endpoint' })
  @IsOptional()
  @IsString()
  q?: string;
}
