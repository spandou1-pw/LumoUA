import { Body, Controller, Get, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { RateLimitGeneral } from '../../common/decorators/rate-limit.decorator';
import { PaginationQueryDto } from '../../common/pagination/pagination.dto';
import { WalletService } from './wallet.service';
import { WalletSecurityService } from './wallet-security.service';
import { CoinTransferService } from './coin-transfer.service';
import { TransferCoinsDto } from './dto/wallet.dto';

@ApiTags('Wallet')
@ApiBearerAuth()
@Controller('wallet')
export class WalletController {
  constructor(
    private readonly walletService: WalletService,
    private readonly security: WalletSecurityService,
    private readonly transferService: CoinTransferService,
  ) {}

  @Get('balance')
  @ApiOperation({ summary: 'Current coin balance (non-redeemable in-app currency)' })
  async balance(@CurrentUser('id') userId: string) {
    const [balance, locked] = await Promise.all([
      this.walletService.getBalance(userId),
      this.security.isLocked(userId),
    ]);
    return { coinBalance: balance.toString(), locked };
  }

  @Get('transactions')
  @ApiOperation({ summary: 'Coins History — full ledger audit trail of every coin movement' })
  @ApiOkResponse({ description: 'Cursor-paginated wallet transactions' })
  async transactions(@CurrentUser('id') userId: string, @Query() pagination: PaginationQueryDto) {
    return this.walletService.listTransactions(userId, pagination.cursor, pagination.limit);
  }

  @Post('transfer')
  @RateLimitGeneral()
  @ApiOperation({ summary: 'Coins Transfers — send spendable coins to another user (closed-loop, non-redeemable; see COINS.md)' })
  async transfer(@CurrentUser('id') userId: string, @Body() dto: TransferCoinsDto) {
    return this.transferService.transfer(userId, dto.recipientId, BigInt(dto.amount), dto.message);
  }

  @Get('transfers/sent')
  @ApiOperation({ summary: 'Coins History — transfers sent, cursor-paginated' })
  async sentTransfers(@CurrentUser('id') userId: string, @Query() pagination: PaginationQueryDto) {
    return this.transferService.sentHistory(userId, pagination.cursor, pagination.limit);
  }

  @Get('transfers/received')
  @ApiOperation({ summary: 'Coins History — transfers received, cursor-paginated' })
  async receivedTransfers(@CurrentUser('id') userId: string, @Query() pagination: PaginationQueryDto) {
    return this.transferService.receivedHistory(userId, pagination.cursor, pagination.limit);
  }
}
