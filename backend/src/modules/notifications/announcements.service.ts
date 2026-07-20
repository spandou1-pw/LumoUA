import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bull';
import { Announcement } from './entities/announcement.entity';
import { User } from '../users/entities/user.entity';

/**
 * doc 04 ADMIN-4 "Announcements": a platform-wide broadcast. Fetching and
 * notifying every user synchronously inside the HTTP request would block
 * for a long time and risk a timeout on any real user base — the actual
 * fan-out happens in a background job (doc 18's job-separation principle,
 * same as every other bulk-dispatch operation in this codebase), the
 * HTTP endpoint just records intent and enqueues it.
 */
@Injectable()
export class AnnouncementsService {
  private readonly logger = new Logger(AnnouncementsService.name);

  constructor(
    @InjectRepository(Announcement) private readonly announcements: Repository<Announcement>,
    @InjectRepository(User) private readonly users: Repository<User>,
    @InjectQueue('announcement-broadcast') private readonly broadcastQueue: Queue,
  ) {}

  async create(actorId: string, title: string, body: string): Promise<Announcement> {
    const announcement = await this.announcements.save(
      this.announcements.create({ title, body, createdBy: actorId, status: 'pending' }),
    );
    await this.broadcastQueue.add('broadcast', { announcementId: announcement.id });
    this.logger.log(`Announcement ${announcement.id} enqueued for broadcast`);
    return announcement;
  }

  async listRecent(limit = 20): Promise<Announcement[]> {
    return this.announcements.find({ order: { createdAt: 'DESC' }, take: limit });
  }

  /** Called by the queue processor — paginates through active users rather than loading them all into memory at once. */
  async *activeUserIdsInBatches(batchSize = 500): AsyncGenerator<string[]> {
    let offset = 0;
    for (;;) {
      const batch = await this.users.find({
        where: { status: 'active' },
        select: ['id'],
        skip: offset,
        take: batchSize,
        order: { id: 'ASC' },
      });
      if (batch.length === 0) return;
      yield batch.map((u) => u.id);
      offset += batchSize;
    }
  }

  async markStatus(id: string, status: Announcement['status'], recipientCount?: number): Promise<void> {
    await this.announcements.update(
      { id },
      {
        status,
        recipientCount: recipientCount ?? undefined,
        completedAt: status === 'completed' || status === 'failed' ? new Date() : undefined,
      },
    );
  }
}
