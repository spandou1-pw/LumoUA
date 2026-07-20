import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { FriendRecommendationsService } from '../../src/modules/ai-platform/recommendations/friend-recommendations.service';
import { Follow } from '../../src/modules/users/entities/follow.entity';
import { Block } from '../../src/modules/users/entities/block.entity';

describe('FriendRecommendationsService', () => {
  let service: FriendRecommendationsService;
  let followsRepo: { find: jest.Mock; createQueryBuilder: jest.Mock };
  let blocksRepo: { find: jest.Mock };

  beforeEach(async () => {
    followsRepo = { find: jest.fn(), createQueryBuilder: jest.fn() };
    blocksRepo = { find: jest.fn() };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        FriendRecommendationsService,
        { provide: getRepositoryToken(Follow), useValue: followsRepo },
        { provide: getRepositoryToken(Block), useValue: blocksRepo },
      ],
    }).compile();

    service = module.get(FriendRecommendationsService);
  });

  it('returns no suggestions for a user who follows nobody', async () => {
    followsRepo.find.mockResolvedValue([]);
    const result = await service.suggest('user-1');
    expect(result).toEqual([]);
  });

  it('suggests a candidate followed by multiple of my follows, ranked by mutual count', async () => {
    followsRepo.find.mockResolvedValueOnce([
      { followerId: 'me', followeeId: 'a' },
      { followerId: 'me', followeeId: 'b' },
      { followerId: 'me', followeeId: 'c' },
    ]);
    blocksRepo.find.mockResolvedValue([]);

    const qb = {
      select: jest.fn().mockReturnThis(),
      addSelect: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      getRawMany: jest.fn().mockResolvedValue([
        { candidateId: 'x', viaUserId: 'a' },
        { candidateId: 'x', viaUserId: 'b' },
        { candidateId: 'x', viaUserId: 'c' },
        { candidateId: 'y', viaUserId: 'a' },
      ]),
    };
    followsRepo.createQueryBuilder.mockReturnValue(qb);

    const result = await service.suggest('me');

    expect(result[0]).toMatchObject({ userId: 'x', mutualCount: 3 });
    expect(result[1]).toMatchObject({ userId: 'y', mutualCount: 1 });
  });

  it('excludes candidates the user already follows', async () => {
    followsRepo.find.mockResolvedValueOnce([{ followerId: 'me', followeeId: 'a' }]);
    blocksRepo.find.mockResolvedValue([]);

    const qb = {
      select: jest.fn().mockReturnThis(),
      addSelect: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      getRawMany: jest.fn().mockResolvedValue([
        { candidateId: 'a', viaUserId: 'a' }, // 'a' is already followed directly — must not suggest re-following self-loop artifact
        { candidateId: 'z', viaUserId: 'a' },
      ]),
    };
    followsRepo.createQueryBuilder.mockReturnValue(qb);

    const result = await service.suggest('me');

    expect(result.find((r) => r.userId === 'a')).toBeUndefined();
    expect(result.find((r) => r.userId === 'z')).toBeDefined();
  });

  it('excludes candidates blocked in either direction', async () => {
    followsRepo.find.mockResolvedValueOnce([{ followerId: 'me', followeeId: 'a' }]);
    blocksRepo.find.mockResolvedValue([{ blockerId: 'me', blockedId: 'z' }]);

    const qb = {
      select: jest.fn().mockReturnThis(),
      addSelect: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      getRawMany: jest.fn().mockResolvedValue([{ candidateId: 'z', viaUserId: 'a' }]),
    };
    followsRepo.createQueryBuilder.mockReturnValue(qb);

    const result = await service.suggest('me');

    expect(result).toEqual([]);
  });
});
