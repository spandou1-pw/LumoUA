import { IsIn, IsOptional, IsString, Length, Matches } from 'class-validator';

export class CreateCommunityDto {
  @IsString()
  @Length(2, 60)
  name: string;

  @IsString()
  @Matches(/^[a-z0-9-]{3,40}$/, {
    message: 'Slug must be 3-40 chars, lowercase letters/digits/hyphen only',
  })
  slug: string;

  @IsOptional()
  @IsString()
  @Length(0, 1000)
  description?: string;

  @IsIn(['public', 'private'])
  visibility: 'public' | 'private';
}

export class UpdateCommunityDto {
  @IsOptional()
  @IsString()
  @Length(2, 60)
  name?: string;

  @IsOptional()
  @IsString()
  @Length(0, 1000)
  description?: string;

  @IsOptional()
  @IsString()
  @Length(0, 4000)
  rules?: string;

  @IsOptional()
  @IsString()
  avatarUrl?: string;

  @IsOptional()
  @IsString()
  coverUrl?: string;
}
