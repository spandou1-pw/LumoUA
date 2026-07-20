import { Field, ID, Int, ObjectType } from '@nestjs/graphql';

@ObjectType()
export class PostGraphQLType {
  @Field(() => ID) id: string;
  @Field(() => ID) authorId: string;
  @Field({ nullable: true }) body?: string;
  @Field() visibility: string;
  @Field() createdAt: Date;
  @Field(() => Int) likeCount: number;
  @Field(() => Int) commentCount: number;
  @Field() viewerHasLiked: boolean;
  @Field() viewerHasBookmarked: boolean;
}

@ObjectType()
export class FeedConnection {
  @Field(() => [PostGraphQLType]) items: PostGraphQLType[];
  @Field({ nullable: true }) nextCursor?: string;
}
