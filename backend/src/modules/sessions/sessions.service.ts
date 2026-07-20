import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { IsNull, Repository } from 'typeorm';
import { RefreshToken } from '../auth/entities/refresh-token.entity';

export interface SessionSummary {
  deviceId: string;
  deviceName: string | null;
  platform: string | null;
  lastUsedAt: Date | null;
  createdAt: Date;
  ipAddress: string | null;
}

/**
 * doc 04 AUTH-7 "Device management: list active sessions, remote logout" —
 * flagged as Phase 3 in the original docs, built now. One refresh token
 * per device is the active-session model already established (doc 23);
 * this service is the first read/selective-revoke surface over that data,
 * distinct from the existing "log out everywhere" (Stage 4) which revokes
 * all-or-nothing.
 */
@Injectable()
export class SessionsService {
  constructor(@InjectRepository(RefreshToken) private readonly refreshTokens: Repository<RefreshToken>) {}

  async listActiveSessions(userId: string): Promise<SessionSummary[]> {
    const tokens = await this.refreshTokens.find({
      where: { userId, revokedAt: IsNull() },
      order: { lastUsedAt: 'DESC' },
    });

    // doc: one row per device_id (a device may have multiple historical
    // rotated-but-still-technically-active rows only in an edge case that
    // shouldn't occur given rotation always revokes the prior row — this
    // dedupes defensively rather than assuming that invariant always holds).
    const byDevice = new Map<string, RefreshToken>();
    for (const token of tokens) {
      const existing = byDevice.get(token.deviceId);
      if (!existing || (token.lastUsedAt ?? token.createdAt) > (existing.lastUsedAt ?? existing.createdAt)) {
        byDevice.set(token.deviceId, token);
      }
    }

    return Array.from(byDevice.values()).map((t) => ({
      deviceId: t.deviceId,
      deviceName: t.deviceName,
      platform: t.platform,
      lastUsedAt: t.lastUsedAt,
      createdAt: t.createdAt,
      ipAddress: t.ipAddress,
    }));
  }

  /** doc: revoke exactly one device's session — the selective counterpart to logoutAllDevices. */
  async revokeSession(userId: string, deviceId: string): Promise<void> {
    const result = await this.refreshTokens.update(
      { userId, deviceId, revokedAt: IsNull() },
      { revokedAt: new Date() },
    );
    if (result.affected === 0) {
      throw new NotFoundException('SESSION_NOT_FOUND');
    }
  }
}
