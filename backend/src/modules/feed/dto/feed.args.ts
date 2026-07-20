import { ArgsType, Field, registerEnumType } from '@nestjs/graphql';
import { IsIn, IsOptional, IsString } from 'class-validator';

export enum FeedType {
  FOLLOWING = 'FOLLOWING',
  GLOBAL = 'GLOBAL',
}
registerEnumType(FeedType, { name: 'FeedType' });

@ArgsType()
export class FeedArgs {
  @Field(() => FeedType, { defaultValue: FeedType.FOLLOWING })
  type: FeedType = FeedType.FOLLOWING;

  @Field({ nullable: true })
  cursor?: string;

  @Field({ nullable: true, defaultValue: 20 })
  limit?: number = 20;
}

/** REST-side equivalent query params (doc 27: REST + GraphQL both call the same service). */
export class FeedQueryDto {
  @IsOptional()
  @IsIn(['following', 'global'])
  type?: 'following' | 'global' = 'following';

  @IsOptional()
  @IsString()
  cursor?: string;
}
