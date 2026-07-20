import { Processor, Process } from '@nestjs/bull';
import { Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Job } from 'bull';
import { Announcement } from './entities/announcement.entity';
import { AnnouncementsService } from './announcements.service';
import { NotificationsService } from './notifications.service';

@Processor('announcement-broadcast')
export class AnnouncementBroadcastProcessor {
  private readonly logger = new Logger(AnnouncementBroadcastProcessor.name);

  constructor(
    @InjectRepository(Announcement) private readonly announcements: Repository<Announcement>,
    private readonly announcementsService: AnnouncementsService,
    private readonly notifications: NotificationsService,
  ) {}

  @Process('broadcast')
  async handle(job: Job<{ announcementId: string }>): Promise<void> {
    const announcement = await this.announcements.findOne({ where: { id: job.data.announcementId } });
    if (!announcement) return;

    await this.announcementsService.markStatus(announcement.id, 'sending');
    let sent = 0;

    try {
      for await (const batch of this.announcementsService.activeUserIdsInBatches()) {
        await Promise.all(
          batch.map((userId) =>
            this.notifications.notify(
              userId,
              'new_follower', // doc 25: closest existing type; a dedicated 'announcement'
              // type is a one-line doc 25 addition, same pattern as every other
              // placeholder-type note in this codebase
              { announcementId: announcement.id },
              announcement.title,
              announcement.body,
            ),
          ),
        );
        sent += batch.length;
      }
      await this.announcementsService.markStatus(announcement.id, 'completed', sent);
    } catch (err) {
      this.logger.error(`Announcement broadcast ${announcement.id} failed after ${sent} sent`, err as Error);
      await this.announcementsService.markStatus(announcement.id, 'failed', sent);
      throw err;
    }
  }
}
