import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { OnEvent } from '@nestjs/event-emitter';
import { User } from '../../users/entities/user.entity';
import { FounderProgramMember } from './entities/founder-program-member.entity';
import { AchievementsService } from '../../profile-customization/achievements.service';

const FOUNDER_PROGRAM_LIMIT = 1000;
const FOUNDER_ACHIEVEMENT_KEY = 'founder';

/**
 * doc GROWTH.md "Founder Program": the first `FOUNDER_PROGRAM_LIMIT` users
 * get a permanent 'founder' achievement — deliberately reuses Stage 10's
 * `AchievementsService.grant()` (idempotent, notifies, showcaseable via
 * the existing Achievement Showcase) rather than building a parallel
 * badge/perk mechanism. This is the "achievement earned by being early,"
 * not a conceptually different kind of reward.
 *
 * Requires an `Achievement` row with key='founder' to exist (created via
 * `ProfileCustomizationAdminController`, Stage 10) — this service grants
 * it, it doesn't define the achievement's name/icon/description itself.
 */
@Injectable()
export class FounderProgramService {
  private readonly logger = new Logger(FounderProgramService.name);

  constructor(
    @InjectRepository(User) private readonly users: Repository<User>,
    @InjectRepository(FounderProgramMember) private readonly members: Repository<FounderProgramMember>,
    private readonly achievements: AchievementsService,
  ) {}

  @OnEvent('user.registered')
  async checkAndGrant(event: { userId: string }): Promise<void> {
    const alreadyGranted = await this.members.exist({ where: { userId: event.userId } });
    if (alreadyGranted) return;

    const currentUserCount = await this.users.count();
    if (currentUserCount > FOUNDER_PROGRAM_LIMIT) return;

    try {
      await this.achievements.grant(event.userId, FOUNDER_ACHIEVEMENT_KEY);
      await this.members.save(
        this.members.create({ userId: event.userId, signupRank: currentUserCount }),
      );
    } catch (err) {
      // doc: if the 'founder' Achievement row hasn't been created yet by an
      // admin, grant() throws NOT_FOUND — logged, not fatal to signup.
      this.logger.warn(`Founder program grant skipped: ${(err as Error).message}`);
    }
  }

  async isFounder(userId: string): Promise<boolean> {
    return this.members.exist({ where: { userId } });
  }

  async remainingSlots(): Promise<number> {
    const currentUserCount = await this.users.count();
    return Math.max(0, FOUNDER_PROGRAM_LIMIT - currentUserCount);
  }
}
