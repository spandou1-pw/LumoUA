import { Body, Controller, Get, Param, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { PlatformRole } from '../../common/enums/role.enum';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { WalletService } from './wallet.service';
import { WalletSecurityService } from './wallet-security.service';
import { WalletFraudService } from './wallet-fraud.service';
import { WalletAnalyticsService } from './wallet-analytics.service';
import { LockWalletDto } from './dto/wallet.dto';

@ApiTags('Admin — Wallet')
@ApiBearerAuth()
@Controller('admin/wallet')
@UseGuards(RolesGuard)
export class WalletAdminController {
  constructor(
    private readonly walletService: WalletService,
    private readonly security: WalletSecurityService,
    private readonly fraud: WalletFraudService,
    private readonly analytics: WalletAnalyticsService,
  ) {}

  // ---------- Wallet Security ----------

  @Get('locked')
  @Roles(PlatformRole.ADMIN)
  @ApiOperation({ summary: 'Currently locked wallets' })
  async listLocked() {
    return this.security.listLocked();
  }

  @Post(':userId/lock')
  @Roles(PlatformRole.ADMIN)
  @ApiOperation({ summary: 'Freeze a wallet pending review — blocks outbound spend/transfer, not incoming credits' })
  async lock(@CurrentUser('id') actorId: string, @Param('userId') userId: string, @Body() dto: LockWalletDto) {
    await this.security.lock(userId, dto.reason, actorId);
    return { locked: true };
  }

  @Post(':userId/unlock')
  @Roles(PlatformRole.ADMIN)
  @ApiOperation({ summary: 'Unfreeze a wallet' })
  async unlock(@CurrentUser('id') actorId: string, @Param('userId') userId: string) {
    await this.security.unlock(userId, actorId);
    return { locked: false };
  }

  @Post(':userId/adjustment')
  @Roles(PlatformRole.ADMIN)
  @ApiOperation({ summary: 'Manual coin balance correction — always tied to an admin actor and a reason (support/ops use)' })
  async adjustment(
    @CurrentUser('id') actorId: string,
    @Param('userId') userId: string,
    @Body('amount') amount: number,
    @Body('reason') reason: string,
  ) {
    const mutation = {
      userId,
      amount: BigInt(amount),
      type: 'admin_adjustment' as const,
      metadata: { adminActorId: actorId, reason },
    };
    return amount >= 0
      ? this.walletService.credit(mutation)
      : this.walletService.debit({ ...mutation, amount: -mutation.amount });
  }

  // ---------- Fraud Detection review queue ----------

  @Get('fraud/flagged-transfers')
  @Roles(PlatformRole.MODERATOR, PlatformRole.ADMIN)
  @ApiOperation({ summary: 'Transfers auto-flagged for structuring-pattern review' })
  async flaggedTransfers() {
    return this.fraud.listFlaggedTransfers();
  }

  // ---------- Wallet Analytics ----------

  @Get('analytics/transfer-volume')
  @Roles(PlatformRole.ADMIN)
  @ApiOperation({ summary: 'Daily transfer volume' })
  async transferVolume(@Query('days') days = 30) {
    return this.analytics.transferVolumeByDay(Number(days));
  }

  @Get('analytics/top-senders')
  @Roles(PlatformRole.ADMIN)
  @ApiOperation({ summary: 'Highest-volume coin senders' })
  async topSenders(@Query('days') days = 30) {
    return this.analytics.topSenders(Number(days));
  }

  @Get('analytics/flagged-count')
  @Roles(PlatformRole.ADMIN)
  @ApiOperation({ summary: 'Count of flagged transfers over the trailing N days' })
  async flaggedCount(@Query('days') days = 30) {
    return { count: await this.analytics.flaggedTransferCount(Number(days)) };
  }

  @Get('analytics/ledger-breakdown')
  @Roles(PlatformRole.ADMIN)
  @ApiOperation({ summary: 'Ledger volume by transaction type' })
  async ledgerBreakdown(@Query('days') days = 30) {
    return this.analytics.ledgerBreakdown(Number(days));
  }
}
