import { NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { SessionsService } from '../../src/modules/sessions/sessions.service';
import { RefreshToken } from '../../src/modules/auth/entities/refresh-token.entity';

describe('SessionsService', () => {
  let service: SessionsService;
  let repo: { find: jest.Mock; update: jest.Mock };

  beforeEach(async () => {
    repo = { find: jest.fn(), update: jest.fn() };
    const module: TestingModule = await Test.createTestingModule({
      providers: [SessionsService, { provide: getRepositoryToken(RefreshToken), useValue: repo }],
    }).compile();
    service = module.get(SessionsService);
  });

  it('returns one summary per distinct device, most-recently-used first', async () => {
    repo.find.mockResolvedValue([
      { deviceId: 'device-a', deviceName: 'iOS', lastUsedAt: new Date('2026-07-18T10:00:00Z'), createdAt: new Date('2026-07-01') },
      { deviceId: 'device-b', deviceName: 'macOS', lastUsedAt: new Date('2026-07-17T10:00:00Z'), createdAt: new Date('2026-07-02') },
    ]);

    const result = await service.listActiveSessions('user-1');

    expect(result).toHaveLength(2);
    expect(result.map((s) => s.deviceId)).toEqual(['device-a', 'device-b']);
  });

  it('dedupes multiple rows for the same device, keeping the most recently used one', async () => {
    repo.find.mockResolvedValue([
      { deviceId: 'device-a', deviceName: 'old-name', lastUsedAt: new Date('2026-07-01T00:00:00Z'), createdAt: new Date('2026-07-01') },
      { deviceId: 'device-a', deviceName: 'current-name', lastUsedAt: new Date('2026-07-18T00:00:00Z'), createdAt: new Date('2026-07-01') },
    ]);

    const result = await service.listActiveSessions('user-1');

    expect(result).toHaveLength(1);
    expect(result[0].deviceName).toBe('current-name');
  });

  it('revokeSession updates exactly the given user+device active token', async () => {
    repo.update.mockResolvedValue({ affected: 1 });
    await service.revokeSession('user-1', 'device-a');
    expect(repo.update).toHaveBeenCalledWith(
      expect.objectContaining({ userId: 'user-1', deviceId: 'device-a' }),
      expect.objectContaining({ revokedAt: expect.any(Date) }),
    );
  });

  it('revokeSession throws NOT_FOUND when no matching active session exists', async () => {
    repo.update.mockResolvedValue({ affected: 0 });
    await expect(service.revokeSession('user-1', 'nonexistent-device')).rejects.toThrow(NotFoundException);
  });
});
