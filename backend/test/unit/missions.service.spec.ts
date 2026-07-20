import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { MissionsService } from '../../src/modules/growth/missions/missions.service';
import { MissionDefinition } from '../../src/modules/growth/missions/entities/mission-definition.entity';
import { UserMissionProgress } from '../../src/modules/growth/missions/entities/user-mission-progress.entity';
import { WalletService } from '../../src/modules/wallet/wallet.service';
import { NotificationsService } from '../../src/modules/notifications/notifications.service';

describe('MissionsService.recordProgress', () => {
  let service: MissionsService;
  let definitionsRepo: { findOne: jest.Mock };
  let progressRepo: { findOne: jest.Mock; save: jest.Mock; create: jest.Mock };
  let wallet: { credit: jest.Mock };
  let notifications: { notify: jest.Mock };

  const mission = {
    id: 'mission-1',
    key: 'send_3_gifts',
    title: 'Send 3 gifts',
    period: 'daily',
    targetCount: 3,
    rewardCoins: '100',
    active: true,
  } as MissionDefinition;

  beforeEach(async () => {
    definitionsRepo = { findOne: jest.fn().mockResolvedValue(mission) };
    progressRepo = {
      findOne: jest.fn(),
      save: jest.fn((x) => x),
      create: jest.fn((x) => ({ ...x })),
    };
    wallet = { credit: jest.fn() };
    notifications = { notify: jest.fn() };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MissionsService,
        { provide: getRepositoryToken(MissionDefinition), useValue: definitionsRepo },
        { provide: getRepositoryToken(UserMissionProgress), useValue: progressRepo },
        { provide: WalletService, useValue: wallet },
        { provide: NotificationsService, useValue: notifications },
      ],
    }).compile();

    service = module.get(MissionsService);
  });

  it('is a silent no-op when there is no active mission for the given key', async () => {
    definitionsRepo.findOne.mockResolvedValue(null);
    await service.recordProgress('user-1', 'nonexistent_mission');
    expect(progressRepo.save).not.toHaveBeenCalled();
  });

  it('increments progress without completing when below the target', async () => {
    progressRepo.findOne.mockResolvedValue(null);
    await service.recordProgress('user-1', 'send_3_gifts', 1);

    const saved = progressRepo.save.mock.calls[0][0];
    expect(saved.progressCount).toBe(1);
    expect(saved.completedAt).toBeUndefined();
    expect(wallet.credit).not.toHaveBeenCalled();
  });

  it('completes and rewards exactly once progress reaches the target', async () => {
    progressRepo.findOne.mockResolvedValue({
      userId: 'user-1',
      missionDefinitionId: 'mission-1',
      periodKey: '2026-07-18',
      progressCount: 2,
      completedAt: null,
      rewardedAt: null,
    });

    await service.recordProgress('user-1', 'send_3_gifts', 1);

    expect(wallet.credit).toHaveBeenCalledWith(
      expect.objectContaining({ userId: 'user-1', amount: 100n, referenceType: 'mission' }),
    );
    expect(notifications.notify).toHaveBeenCalled();
  });

  it('does not record further progress once already completed this period (no double-reward)', async () => {
    progressRepo.findOne.mockResolvedValue({
      userId: 'user-1',
      missionDefinitionId: 'mission-1',
      periodKey: '2026-07-18',
      progressCount: 3,
      completedAt: new Date('2026-07-18T10:00:00Z'),
      rewardedAt: new Date('2026-07-18T10:00:00Z'),
    });

    await service.recordProgress('user-1', 'send_3_gifts', 1);

    expect(progressRepo.save).not.toHaveBeenCalled();
    expect(wallet.credit).not.toHaveBeenCalled();
  });

  it('caps progressCount at the mission target even if a larger amount is recorded at once', async () => {
    progressRepo.findOne.mockResolvedValue({
      userId: 'user-1',
      missionDefinitionId: 'mission-1',
      periodKey: '2026-07-18',
      progressCount: 0,
      completedAt: null,
      rewardedAt: null,
    });

    await service.recordProgress('user-1', 'send_3_gifts', 10);

    const saved = progressRepo.save.mock.calls[0][0];
    expect(saved.progressCount).toBe(3); // capped at targetCount, not 10
  });
});
