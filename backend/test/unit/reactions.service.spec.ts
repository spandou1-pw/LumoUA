import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { ReactionsService } from '../../src/modules/reactions/reactions.service';
import { Like } from '../../src/modules/reactions/entities/like.entity';

describe('ReactionsService', () => {
  let service: ReactionsService;
  let repo: { exist: jest.Mock; insert: jest.Mock; delete: jest.Mock; count: jest.Mock; find: jest.Mock; createQueryBuilder: jest.Mock };
  let events: { emit: jest.Mock };

  beforeEach(async () => {
    repo = {
      exist: jest.fn(),
      insert: jest.fn(),
      delete: jest.fn(),
      count: jest.fn(),
      find: jest.fn(),
      createQueryBuilder: jest.fn(),
    };
    events = { emit: jest.fn() };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ReactionsService,
        { provide: getRepositoryToken(Like), useValue: repo },
        { provide: EventEmitter2, useValue: events },
      ],
    }).compile();

    service = module.get(ReactionsService);
  });

  describe('like()', () => {
    it('is idempotent — does not insert or emit an event on a duplicate like', async () => {
      repo.exist.mockResolvedValue(true);

      await service.like('user-1', 'post', 'post-1');

      expect(repo.insert).not.toHaveBeenCalled();
      expect(events.emit).not.toHaveBeenCalled();
    });

    it('inserts the like and emits reaction.created on first like', async () => {
      repo.exist.mockResolvedValue(false);

      await service.like('user-1', 'post', 'post-1');

      expect(repo.insert).toHaveBeenCalledWith({
        userId: 'user-1',
        targetType: 'post',
        targetId: 'post-1',
      });
      expect(events.emit).toHaveBeenCalledWith('reaction.created', {
        userId: 'user-1',
        targetType: 'post',
        targetId: 'post-1',
      });
    });
  });

  describe('unlike()', () => {
    it('deletes the like row for the given user/target', async () => {
      await service.unlike('user-1', 'comment', 'comment-1');

      expect(repo.delete).toHaveBeenCalledWith({
        userId: 'user-1',
        targetType: 'comment',
        targetId: 'comment-1',
      });
    });
  });

  describe('countMany()', () => {
    it('returns an empty map without querying when given no target ids', async () => {
      const result = await service.countMany('post', []);

      expect(result.size).toBe(0);
      expect(repo.createQueryBuilder).not.toHaveBeenCalled();
    });

    it('builds a per-target count map from the grouped query result', async () => {
      const qb = {
        select: jest.fn().mockReturnThis(),
        addSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        groupBy: jest.fn().mockReturnThis(),
        getRawMany: jest.fn().mockResolvedValue([
          { targetId: 'post-1', count: '3' },
          { targetId: 'post-2', count: '0' },
        ]),
      };
      repo.createQueryBuilder.mockReturnValue(qb);

      const result = await service.countMany('post', ['post-1', 'post-2']);

      expect(result.get('post-1')).toBe(3);
      expect(result.get('post-2')).toBe(0);
    });
  });
});
