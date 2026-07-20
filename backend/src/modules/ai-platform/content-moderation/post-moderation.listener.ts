import { Injectable } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { ContentModerationService } from './content-moderation.service';

interface PostCreatedEvent {
  post: { id: string; body: string | null };
}

/**
 * doc 18: moderation screening must not add latency to the posting flow —
 * this listens for the `post.created` event PostsService already emits
 * (Stage 5) rather than PostsService calling ContentModerationService
 * directly, keeping the write path itself unaware moderation exists.
 */
@Injectable()
export class PostModerationListener {
  constructor(private readonly contentModeration: ContentModerationService) {}

  @OnEvent('post.created')
  async handlePostCreated(event: PostCreatedEvent): Promise<void> {
    if (!event.post.body) return;
    await this.contentModeration.screenText('post', event.post.id, event.post.body);
  }
}
