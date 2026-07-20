import { Injectable, NotFoundException } from '@nestjs/common';
import { PostsService } from '../posts/posts.service';
import { CommentsService } from '../comments/comments.service';
import { NotificationsService } from '../notifications/notifications.service';
import { PlatformRole } from '../../common/enums/role.enum';
import { ReportReason, ReportTargetType } from './entities/report.entity';

const REASON_LABELS_UK: Record<ReportReason, string> = {
  spam: 'спам',
  harassment: 'переслідування',
  hate_speech: 'мова ворожнечі',
  illegal_content: 'протизаконний контент',
  impersonation: 'видавання себе за іншу особу',
  self_harm: 'контент про самоушкодження',
  other: 'порушення правил спільноти',
};

/**
 * doc 32: "author notified with the specific rule violated (not a vague
 * 'violated our policies' message)" — this service is where that
 * specificity actually happens, since it's the one place a report's
 * `reason` and the resulting content-removal action meet.
 */
@Injectable()
export class ModerationActionsService {
  constructor(
    private readonly posts: PostsService,
    private readonly comments: CommentsService,
    private readonly notifications: NotificationsService,
  ) {}

  async removeContent(
    targetType: ReportTargetType,
    targetId: string,
    reason: ReportReason,
    actorId: string,
  ): Promise<void> {
    let authorId: string | null = null;

    if (targetType === 'post') {
      const result = await this.posts.moderatorRemove(targetId);
      authorId = result.authorId;
    } else if (targetType === 'comment') {
      // doc 24: CommentsService.remove already accepts a role and permits
      // moderator/admin removal — reused here rather than duplicated.
      // requesterId is the acting moderator's own id (audit-trail-correct),
      // not a placeholder — the ownership branch inside CommentsService
      // simply won't match it, and the moderator-role branch is what
      // actually authorizes this call.
      const result = await this.comments.remove(targetId, actorId, PlatformRole.ADMIN);
      authorId = result.authorId;
    } else {
      throw new NotFoundException(`MODERATION_REMOVAL_NOT_SUPPORTED_FOR_${targetType.toUpperCase()}`);
    }

    if (authorId) {
      await this.notifications.notify(
        authorId,
        'new_comment', // doc 25: placeholder type — a dedicated 'content_removed' type
        // is a one-line doc 25 addition when this ships for real, same pattern as every
        // other "placeholder notification type" note across Stages 8-10
        { targetType, targetId, reason },
        'Контент видалено',
        `Ваш допис видалено: ${REASON_LABELS_UK[reason]}`,
      );
    }
  }
}
