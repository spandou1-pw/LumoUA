import { ForbiddenException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Wallet } from './entities/wallet.entity';
import { AdminAuditLog } from '../admin/entities/admin-audit-log.entity';

/**
 * doc COINS.md "Wallet Security": a locked wallet blocks spend/transfer
 * operations (checked explicitly by WalletService before any debit), but
 * NOT incoming credits — a wallet under review can still receive a refund
 * reversal or an admin adjustment; locking is about preventing further
 * outbound activity while something is investigated, not freezing the
 * account into an inconsistent state.
 */
@Injectable()
export class WalletSecurityService {
  constructor(
    @InjectRepository(Wallet) private readonly wallets: Repository<Wallet>,
    @InjectRepository(AdminAuditLog) private readonly auditLog: Repository<AdminAuditLog>,
  ) {}

  async lock(userId: string, reason: string, actorId: string | null): Promise<void> {
    await this.wallets.update({ userId }, { locked: true, lockedReason: reason, lockedAt: new Date() });
    await this.auditLog.insert({
      actorId: actorId ?? userId, // system-initiated locks (fraud auto-flag) log the affected user as actor for traceability
      action: 'WALLET_LOCKED',
      targetType: 'wallet',
      targetId: userId,
      metadata: { reason, automated: actorId === null },
    });
  }

  async unlock(userId: string, actorId: string): Promise<void> {
    await this.wallets.update({ userId }, { locked: false, lockedReason: null, lockedAt: null });
    await this.auditLog.insert({
      actorId,
      action: 'WALLET_UNLOCKED',
      targetType: 'wallet',
      targetId: userId,
    });
  }

  async assertNotLocked(userId: string): Promise<void> {
    const wallet = await this.wallets.findOne({ where: { userId } });
    if (wallet?.locked) {
      throw new ForbiddenException('WALLET_LOCKED');
    }
  }

  async isLocked(userId: string): Promise<boolean> {
    const wallet = await this.wallets.findOne({ where: { userId } });
    return wallet?.locked ?? false;
  }

  async listLocked(): Promise<Wallet[]> {
    return this.wallets.find({ where: { locked: true } });
  }
}
