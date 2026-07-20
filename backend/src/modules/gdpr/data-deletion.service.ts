import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { v4 as uuid } from 'uuid';
import { User } from '../users/entities/user.entity';
import { DataDeletionRequest } from './entities/data-deletion-request.entity';
import { FilesService } from '../files/files.service';
import { AuthService } from '../auth/auth.service';

/**
 * doc GDPR.md "Right to Erasure" (Art. 17): anonymize rather than hard-
 * delete the user row. This is the standard, defensible pattern for a
 * social platform specifically because other users' content (replies,
 * comment threads, gift history) references this user — an abrupt hard
 * delete would either cascade-destroy content that isn't solely the
 * deleted user's to erase (a reply thread other people wrote) or leave
 * dangling foreign keys. Anonymization satisfies "this person's personal
 * data is gone" (name, email, bio, avatar — all scrubbed) while
 * preserving referential integrity. Object storage assets (avatar/cover/
 * post images — genuinely and solely this user's files) ARE hard-deleted
 * via the existing `FilesService.deleteAllForUser` (built in Stage 4,
 * reused here rather than reimplemented).
 *
 * doc 45's backup-retention tension is explicit and unresolved by this
 * service alone: live-data anonymization happens here; whatever remains
 * in point-in-time database backups ages out per doc 45's retention
 * schedule, not instantly. That gap needs real legal sign-off on an
 * acceptable window (doc 49), not an engineering assumption.
 */
@Injectable()
export class DataDeletionService {
  private readonly logger = new Logger(DataDeletionService.name);

  constructor(
    @InjectRepository(User) private readonly users: Repository<User>,
    @InjectRepository(DataDeletionRequest) private readonly requests: Repository<DataDeletionRequest>,
    private readonly filesService: FilesService,
    private readonly authService: AuthService,
  ) {}

  async requestDeletion(userId: string): Promise<DataDeletionRequest> {
    return this.requests.save(this.requests.create({ userId, status: 'pending' }));
  }

  /**
   * doc 18: called from `DataDeletionProcessor` (a real BullMQ job), never
   * inline in the HTTP request that requested it — same job-separation
   * principle as every other multi-step operation in this codebase.
   */
  async processDeletion(requestId: string): Promise<void> {
    const request = await this.requests.findOne({ where: { id: requestId } });
    if (!request) return;

    request.status = 'processing';
    await this.requests.save(request);

    try {
      await this.authService.logoutAllDevices(request.userId);
      await this.filesService.deleteAllForUser(request.userId);
      await this.anonymizeUser(request.userId);

      request.status = 'completed';
      request.completedAt = new Date();
      await this.requests.save(request);
    } catch (err) {
      this.logger.error(`Deletion request ${requestId} failed`, err as Error);
      request.status = 'failed';
      request.error = (err as Error).message;
      await this.requests.save(request);
      throw err;
    }
  }

  private async anonymizeUser(userId: string): Promise<void> {
    const anonymizedSuffix = uuid().slice(0, 8);
    await this.users.update(
      { id: userId },
      {
        email: null,
        username: `deleted_user_${anonymizedSuffix}`,
        displayName: 'Видалений користувач',
        bio: null,
        avatarUrl: null,
        coverUrl: null,
        status: 'deleted',
      },
    );
  }
}
