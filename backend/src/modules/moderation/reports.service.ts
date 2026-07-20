import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Report, ReportReason, ReportTargetType } from './entities/report.entity';
import { AdminAuditLog } from '../admin/entities/admin-audit-log.entity';

@Injectable()
export class ReportsService {
  constructor(
    @InjectRepository(Report) private readonly reports: Repository<Report>,
    @InjectRepository(AdminAuditLog) private readonly auditLog: Repository<AdminAuditLog>,
  ) {}

  async file(
    reporterId: string | null,
    targetType: ReportTargetType,
    targetId: string,
    reason: ReportReason,
    detail?: string,
    filedByAi = false,
  ): Promise<Report> {
    return this.reports.save(
      this.reports.create({ reporterId, targetType, targetId, reason, detail: detail ?? null, filedByAi }),
    );
  }

  /**
   * doc 32 Report Queue prioritization: severity category first (self_harm/
   * illegal_content surface regardless of volume), then report count
   * (multiple reports on the same target aggregated, not listed as
   * duplicates), then age. This query implements the severity-first part;
   * the aggregation-by-target part is `pendingGroupedByTarget` below.
   */
  async listOpen(limit = 50): Promise<Report[]> {
    const severityOrder = `CASE reason
      WHEN 'illegal_content' THEN 0
      WHEN 'self_harm' THEN 0
      WHEN 'hate_speech' THEN 1
      WHEN 'harassment' THEN 1
      WHEN 'impersonation' THEN 2
      WHEN 'spam' THEN 3
      ELSE 4 END`;
    return this.reports
      .createQueryBuilder('r')
      .where('r.status = :status', { status: 'open' })
      .orderBy(severityOrder, 'ASC')
      .addOrderBy('r.created_at', 'ASC')
      .limit(limit)
      .getMany();
  }

  /** doc 32: "multiple reports on same item, aggregate rather than list duplicates". */
  async pendingGroupedByTarget(): Promise<{ targetType: string; targetId: string; reportCount: number }[]> {
    const rows = await this.reports
      .createQueryBuilder('r')
      .select('r.target_type', 'targetType')
      .addSelect('r.target_id', 'targetId')
      .addSelect('COUNT(*)', 'reportCount')
      .where('r.status = :status', { status: 'open' })
      .groupBy('r.target_type')
      .addGroupBy('r.target_id')
      .orderBy('"reportCount"', 'DESC')
      .getRawMany<{ targetType: string; targetId: string; reportCount: string }>();
    return rows.map((r) => ({ ...r, reportCount: Number(r.reportCount) }));
  }

  async resolve(
    reportId: string,
    actorId: string,
    status: 'dismissed' | 'actioned',
    note?: string,
  ): Promise<Report> {
    const report = await this.reports.findOne({ where: { id: reportId } });
    if (!report) throw new NotFoundException('REPORT_NOT_FOUND');

    report.status = status;
    report.resolvedAt = new Date();
    report.resolvedBy = actorId;
    report.resolutionNote = note ?? null;
    const saved = await this.reports.save(report);

    await this.auditLog.insert({
      actorId,
      action: `REPORT_${status.toUpperCase()}`,
      targetType: 'report',
      targetId: report.id,
      metadata: { originalTargetType: report.targetType, originalTargetId: report.targetId, note },
    });

    return saved;
  }

  async countOpen(): Promise<number> {
    return this.reports.count({ where: { status: 'open' } });
  }

  async myReports(reporterId: string): Promise<Report[]> {
    return this.reports.find({ where: { reporterId }, order: { createdAt: 'DESC' } });
  }
}
