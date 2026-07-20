import { Args, Context, Query, Resolver } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { FeedService } from './feed.service';
import { FeedArgs, FeedType } from './dto/feed.args';
import { FeedConnection } from './dto/feed.graphql-type';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';

@Resolver(() => FeedConnection)
@UseGuards(JwtAuthGuard)
export class FeedResolver {
  constructor(private readonly feedService: FeedService) {}

  @Query(() => FeedConnection, {
    description:
      'doc 22: feed(type, cursor) — resolves post + author + media + viewer engagement state in one round trip',
  })
  async feed(@Args() args: FeedArgs, @Context() ctx: any): Promise<FeedConnection> {
    const viewerId = ctx.req.user.id;
    const result =
      args.type === FeedType.GLOBAL
        ? await this.feedService.global(viewerId, args.cursor, args.limit)
        : await this.feedService.following(viewerId, args.cursor, args.limit);
    return { items: result.items as any, nextCursor: result.nextCursor ?? undefined };
  }
}
