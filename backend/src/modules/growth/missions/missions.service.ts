import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { MissionDefinition } from './entities/mission-definition.entity';
import { UserMissionProgress } from './entities/user-mission-progress.entity';
import { MissionPeriodCalculator } from './mission-period.calculator';
import { WalletService } from '../../wallet/wallet.service';
import { NotificationsService } from '../../notifications/notifications.service';

@Injectable()
export class MissionsService {
  constructor(
    @InjectRepository(MissionDefinition) private readonly definitions: Repository<MissionDefinition>,
    @InjectRepository(UserMissionProgress) private readonly progress: Repository<UserMissionProgress>,
    private readonly wallet: WalletService,
    private readonly notifications: NotificationsService,
  ) {}

  async listActive(period?: 'daily' | 'weekly' | 'seasonal'): Promise<MissionDefinition[]> {
    return this.definitions.find({ where: period ? { active: true, period } : { active: true } });
  }

  async myProgress(userId: string): Promise<(UserMissionProgress & { mission: MissionDefinition | null })[]> {
    const active = await this.listActive();
    const results = await Promise.all(
      active.map(async (mission) => {
        const periodKey = MissionPeriodCalculator.periodKeyFor(mission.period);
        let row = await this.progress.findOne({
          where: { userId, missionDefinitionId: mission.id, periodKey },
        });
        if (!row) {
          row = this.progress.create({ userId, missionDefinitionId: mission.id, periodKey, progressCount: 0 });
        }
        return { ...row, mission };
      }),
    );
    return results;
  }

  /**
   * doc GROWTH.md: called by other domain modules (e.g. GiftsService after
   * a successful send, PostsService after a post is created) via the
   * mission's `key` — this service doesn't know or care which action
   * triggered progress, keeping mission definitions purely data-driven
   * (a new mission tied to an existing action requires no new code, just
   * a new `MissionDefinition` row with the matching key).
   */
  async recordProgress(userId: string, missionKey: string, amount = 1): Promise<void> {
    const mission = await this.definitions.findOne({ where: { key: missionKey, active: true } });
    if (!mission) return; // no active mission for this key — a normal, frequent no-op, not an error

    const periodKey = MissionPeriodCalculator.periodKeyFor(mission.period);
    let row = await this.progress.findOne({
      where: { userId, missionDefinitionId: mission.id, periodKey },
    });
    if (!row) {
      row = this.progress.create({ userId, missionDefinitionId: mission.id, periodKey, progressCount: 0 });
    }

    if (row.completedAt) return; // already completed this period — no further progress/double-reward

    row.progressCount = Math.min(row.progressCount + amount, mission.targetCount);
    if (row.progressCount >= mission.targetCount) {
      row.completedAt = new Date();
    }
    await this.progress.save(row);

    if (row.completedAt && !row.rewardedAt) {
      await this.rewardCompletion(row, mission);
    }
  }

  private async rewardCompletion(row: UserMissionProgress, mission: MissionDefinition): Promise<void> {
    await this.wallet.credit({
      userId: row.userId,
      amount: BigInt(mission.rewardCoins),
      type: 'admin_adjustment', // doc: same placeholder-type note as referrals — a dedicated 'mission_reward' type is a one-line addition when this ships for real
      referenceType: 'mission',
      referenceId: mission.id,
      metadata: { periodKey: row.periodKey, missionKey: mission.key },
    });

    row.rewardedAt = new Date();
    await this.progress.save(row);

    await this.notifications.notify(
      row.userId,
      'new_follower',
      { missionId: mission.id },
      'Місію виконано!',
      `${mission.title} — отримано ${mission.rewardCoins} монет`,
    );
  }
}
