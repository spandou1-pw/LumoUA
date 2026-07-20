import { IsIn, IsInt, IsOptional, Max, Min } from 'class-validator';

const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp'] as const;
const ALLOWED_VIDEO_TYPES = ['video/mp4', 'video/quicktime'] as const;

export class RequestUploadUrlDto {
  @IsIn([...ALLOWED_IMAGE_TYPES, ...ALLOWED_VIDEO_TYPES])
  contentType: string;

  @IsIn(['post', 'avatar', 'cover', 'message', 'community'])
  ownerType: 'post' | 'avatar' | 'cover' | 'message' | 'community';

  @IsInt()
  @Min(1)
  @Max(200 * 1024 * 1024) // 200MB hard ceiling; per-type caps enforced in service
  contentLengthBytes: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  position?: number;
}
