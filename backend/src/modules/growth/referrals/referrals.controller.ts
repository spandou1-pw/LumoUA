import { Controller, Get } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../../../common/decorators/current-user.decorator';
import { ReferralsService } from './referrals.service';

@ApiTags('Referrals')
@ApiBearerAuth()
@Controller('referrals')
export class ReferralsController {
  constructor(private readonly referralsService: ReferralsService) {}

  @Get('my-code')
  @ApiOperation({ summary: 'Your stable referral code (Invite Friends)' })
  async myCode(@CurrentUser('id') userId: string) {
    const code = await this.referralsService.getOrCreateCode(userId);
    return { code };
  }

  @Get('mine')
  @ApiOperation({ summary: 'Referrals you have made, with status' })
  async mine(@CurrentUser('id') userId: string) {
    return this.referralsService.myReferrals(userId);
  }

  @Get('stats')
  @ApiOperation({ summary: 'Referral summary: total, qualified, pending' })
  async stats(@CurrentUser('id') userId: string) {
    return this.referralsService.stats(userId);
  }
}
