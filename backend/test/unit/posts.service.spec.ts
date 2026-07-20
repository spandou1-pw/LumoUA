import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { PostsService } from '../../src/modules/posts/posts.service';
import { Post } from '../../src/modules/posts/entities/post.entity';
import { PostMedia } from '../../src/modules/posts/entities/post-media.entity';
import { Bookmark } from '../../src/modules/posts/entities/bookmark.entity';
import { FilesService } from '../../src/modules/files/files.service';
import { ReactionsService } from '../../src/modules/reactions/reactions.service';
import { PolicyService } from '../../src/modules/users/policy.service';

describe('PostsService — authorization (doc 24)', () => {
  let service: PostsService;
  let postsRepo: { findOne: jest.Mock; save: jest.Mock };

  beforeEach(async () => {
    postsRepo = { findOne: jest.fn(), save: jest.fn() };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PostsService,
        { provide: getRepositoryToken(Post), useValue: postsRepo },
        { provide: getRepositoryToken(PostMedia), useValue: {} },
        { provide: getRepositoryToken(Bookmark), useValue: { find: jest.fn().mockResolvedValue([]) } },
        { provide: FilesService, useValue: {} },
        { provide: ReactionsService, useValue: { countMany: jest.fn().mockResolvedValue(new Map()), viewerLikedSet: jest.fn().mockResolvedValue(new Set()) } },
        { provide: PolicyService, useValue: {} },
        { provide: EventEmitter2, useValue: { emit: jest.fn() } },
      ],
    }).compile();

    service = module.get(PostsService);
  });

  it('throws NOT_FOUND when the post does not exist', async () => {
    postsRepo.findOne.mockResolvedValue(null);

    await expect(service.update('missing-post', 'user-1', { body: 'x' })).rejects.toThrow(
      NotFoundException,
    );
  });

  it('throws FORBIDDEN when a non-author tries to edit a post', async () => {
    postsRepo.findOne.mockResolvedValue({ id: 'post-1', authorId: 'owner-1', body: 'original' });

    await expect(service.update('post-1', 'attacker-1', { body: 'hacked' })).rejects.toThrow(
      ForbiddenException,
    );
  });

  it('allows the author to edit their own post', async () => {
    const existing = { id: 'post-1', authorId: 'owner-1', body: 'original' };
    postsRepo.findOne.mockResolvedValue(existing);
    postsRepo.save.mockImplementation(async (p) => p);

    const result = await service.update('post-1', 'owner-1', { body: 'updated' });

    expect(result.body).toBe('updated');
    expect(postsRepo.save).toHaveBeenCalled();
  });

  it('soft-deletes by setting deletedAt, not by removing the row', async () => {
    const existing = { id: 'post-1', authorId: 'owner-1', body: 'x', deletedAt: null };
    postsRepo.findOne.mockResolvedValue(existing);
    postsRepo.save.mockImplementation(async (p) => p);

    await service.softDelete('post-1', 'owner-1');

    expect(postsRepo.save).toHaveBeenCalledWith(expect.objectContaining({ deletedAt: expect.any(Date) }));
  });
});
