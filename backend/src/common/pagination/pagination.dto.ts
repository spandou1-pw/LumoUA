import { IsInt, IsOptional, IsString, Max, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';

/**
 * doc 22: cursor-based pagination on every list endpoint — never offset
 * pagination, since feed/chat/comment lists mutate concurrently and offset
 * pagination would produce duplicate/skipped items under concurrent writes.
 */
export class PaginationQueryDto {
  @ApiPropertyOptional({ description: 'Opaque cursor from the previous page\'s nextCursor' })
  @IsOptional()
  @IsString()
  cursor?: string;

  @ApiPropertyOptional({ default: 20, minimum: 1, maximum: 100 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit: number = 20;
}

export interface PaginatedResult<T> {
  items: T[];
  nextCursor: string | null;
}

/** Builds the envelope + computes nextCursor from the last item's sort field. */
export function paginate<T extends { createdAt: Date }>(
  items: T[],
  limit: number,
): PaginatedResult<T> {
  const hasMore = items.length > limit;
  const page = hasMore ? items.slice(0, limit) : items;
  const nextCursor = hasMore ? page[page.length - 1].createdAt.toISOString() : null;
  return { items: page, nextCursor };
}
