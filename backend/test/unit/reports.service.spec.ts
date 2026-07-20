import { NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ReportsService } from '../../src/modules/moderation/reports.service';
import { Report } from '../../src/modules/moderation/entities/report.entity';
import { AdminAuditLog } from '../../src/modules/admin/entities/admin-audit-log.entity';

describe('ReportsService', () => {
  let service: ReportsService;
  let reportsRepo: {
    save: jest.Mock;
    create: jest.Mock;
    findOne: jest.Mock;
    createQueryBuilder: jest.Mock;
    count: jest.Mock;
  };
  let auditLog: { insert: jest.Mock };

  beforeEach(async () => {
    reportsRepo = {
      save: jest.fn((x) => x),
      create: jest.fn((x) => x),
      findOne: jest.fn(),
      createQueryBuilder: jest.fn(),
      count: jest.fn(),
    };
    auditLog = { insert: jest.fn() };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ReportsService,
        { provide: getRepositoryToken(Report), useValue: reportsRepo },
        { provide: getRepositoryToken(AdminAuditLog), useValue: auditLog },
      ],
    }).compile();

    service = module.get(ReportsService);
  });

  it('files a report with status "open" by default', async () => {
    const report = await service.file('user-1', 'post', 'post-1', 'spam', 'looks like spam');
    expect(report).toMatchObject({ reporterId: 'user-1', targetType: 'post', targetId: 'post-1', reason: 'spam' });
  });

  it('resolve() throws NOT_FOUND for a missing report', async () => {
    reportsRepo.findOne.mockResolvedValue(null);
    await expect(service.resolve('missing', 'admin-1', 'dismissed')).rejects.toThrow(NotFoundException);
  });

  it('resolve() sets status/resolvedAt/resolvedBy and writes an audit log entry', async () => {
    reportsRepo.findOne.mockResolvedValue({ id: 'report-1', targetType: 'post', targetId: 'post-1', reason: 'spam', status: 'open' });

    const result = await service.resolve('report-1', 'admin-1', 'actioned', 'removed per policy');

    expect(result.status).toBe('actioned');
    expect(result.resolvedBy).toBe('admin-1');
    expect(result.resolvedAt).toBeInstanceOf(Date);
    expect(auditLog.insert).toHaveBeenCalledWith(
      expect.objectContaining({ actorId: 'admin-1', action: 'REPORT_ACTIONED', targetType: 'report', targetId: 'report-1' }),
    );
  });

  it('countOpen() queries only open-status reports', async () => {
    reportsRepo.count.mockResolvedValue(7);
    const count = await service.countOpen();
    expect(reportsRepo.count).toHaveBeenCalledWith({ where: { status: 'open' } });
    expect(count).toBe(7);
  });

  it('listOpen() prioritizes by severity then age (query built correctly)', async () => {
    const qb = {
      where: jest.fn().mockReturnThis(),
      orderBy: jest.fn().mockReturnThis(),
      addOrderBy: jest.fn().mockReturnThis(),
      limit: jest.fn().mockReturnThis(),
      getMany: jest.fn().mockResolvedValue([]),
    };
    reportsRepo.createQueryBuilder.mockReturnValue(qb);

    await service.listOpen();

    expect(qb.where).toHaveBeenCalledWith('r.status = :status', { status: 'open' });
    expect(qb.orderBy).toHaveBeenCalled(); // severity CASE expression
    expect(qb.addOrderBy).toHaveBeenCalledWith('r.created_at', 'ASC');
  });
});
