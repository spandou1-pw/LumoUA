import { NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { AchievementsService } from '../../src/modules/profile-customization/achievements.service';
import { Achievement } from '../../src/modules/profile-customization/entities/achievement.entity';
import { UserAchievement } from '../../src/modules/profile-customization/entities/user-achievement.entity';
import { NotificationsService } from '../../src/modules/notifications/notifications.service';

describe('AchievementsService.grant — idempotency', () => {
  let service: AchievementsService;
  let achievementsRepo: { findOne: jest.Mock };
  let userAchievementsRepo: { findOne: jest.Mock; save: jest.Mock; create: jest.Mock };
  let notifications: { notify: jest.Mock };

  beforeEach(async () => {
    achievementsRepo = { findOne: jest.fn() };
    userAchievementsRepo = { findOne: jest.fn(), save: jest.fn((x) => x), create: jest.fn((x) => x) };
    notifications = { notify: jest.fn() };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AchievementsService,
        { provide: getRepositoryToken(Achievement), useValue: achievementsRepo },
        { provide: getRepositoryToken(UserAchievement), useValue: userAchievementsRepo },
        { provide: NotificationsService, useValue: notifications },
      ],
    }).compile();

    service = module.get(AchievementsService);
  });

  it('throws NOT_FOUND for an unknown or inactive achievement key', async () => {
    achievementsRepo.findOne.mockResolvedValue(null);

    await expect(service.grant('user-1', 'nonexistent')).rejects.toThrow(NotFoundException);
  });

  it('grants the achievement and notifies the user on first grant', async () => {
    achievementsRepo.findOne.mockResolvedValue({ id: 'ach-1', key: 'first_post', name: 'First Post' });
    userAchievementsRepo.findOne.mockResolvedValue(null);

    const result = await service.grant('user-1', 'first_post');

    expect(result).toMatchObject({ userId: 'user-1', achievementId: 'ach-1' });
    expect(userAchievementsRepo.save).toHaveBeenCalled();
    expect(notifications.notify).toHaveBeenCalled();
  });

  it('is a no-op on a second grant of the same achievement — never errors, never double-notifies', async () => {
    achievementsRepo.findOne.mockResolvedValue({ id: 'ach-1', key: 'first_post', name: 'First Post' });
    userAchievementsRepo.findOne.mockResolvedValue({ userId: 'user-1', achievementId: 'ach-1' }); // already earned

    const result = await service.grant('user-1', 'first_post');

    expect(result).toBeNull();
    expect(userAchievementsRepo.save).not.toHaveBeenCalled();
    expect(notifications.notify).not.toHaveBeenCalled();
  });
});
