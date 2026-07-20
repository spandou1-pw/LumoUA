import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { Achievement } from './entities/achievement.entity';
import { UserAchievement } from './entities/user-achievement.entity';
import { NotificationsService } from '../notifications/notifications.service';

@Injectable()
export class AchievementsService {
  constructor(
    @InjectRepository(Achievement) private readonly achievements: Repository<Achievement>,
    @InjectRepository(UserAchievement) private readonly userAchievements: Repository<UserAchievement>,
    private readonly notifications: NotificationsService,
  ) {}

  async listCatalog(): Promise<Achievement[]> {
    return this.achievements.find({ where: { active: true } });
  }

  async listEarnedForUser(userId: string): Promise<(UserAchievement & { achievement: Achievement | null })[]> {
    const earned = await this.userAchievements.find({ where: { userId }, order: { earnedAt: 'DESC' } });
    if (earned.length === 0) return [];
    const achievementIds = earned.map((e) => e.achievementId);
    const items = await this.achievements.find({ where: { id: In(achievementIds) } });
    const byId = new Map(items.map((a) => [a.id, a]));
    return earned.map((e) => ({ ...e, achievement: byId.get(e.achievementId) ?? null }));
  }

  /**
   * doc PROFILE.md: idempotent — re-triggering the same achievement (e.g. a
   * buggy event handler firing twice) never grants it a second time or
   * errors loudly; it's a no-op after the first grant. Real achievement
   * *triggers* (first post, first gift sent, N followers reached, etc.)
   * are domain events other modules would emit and this service would
   * listen for — that event-wiring is a follow-up (see doc PROFILE.md),
   * this method is the grant primitive everything else calls.
   */
  async grant(userId: string, achievementKey: string): Promise<UserAchievement | null> {
    const achievement = await this.achievements.findOne({ where: { key: achievementKey, active: true } });
    if (!achievement) throw new NotFoundException('ACHIEVEMENT_NOT_FOUND');

    const already = await this.userAchievements.findOne({
      where: { userId, achievementId: achievement.id },
    });
    if (already) return null; // idempotent no-op, not an error

    const record = await this.userAchievements.save(
      this.userAchievements.create({ userId, achievementId: achievement.id }),
    );

    await this.notifications.notify(
      userId,
      'new_like', // doc 25: placeholder type, same pattern as Stage 8/9 — a dedicated
      // 'achievement_earned' type is a one-line doc 25 addition when this ships for real
      { achievementId: achievement.id, achievementKey },
      'Нове досягнення!',
      achievement.name,
    );

    return record;
  }

  async hasEarned(userId: string, achievementId: string): Promise<boolean> {
    return this.userAchievements.exist({ where: { userId, achievementId } });
  }
}
