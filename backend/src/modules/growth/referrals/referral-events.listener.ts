import { Injectable } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { ReferralsService } from './referrals.service';

@Injectable()
export class ReferralEventsListener {
  constructor(private readonly referrals: ReferralsService) {}

  @OnEvent('user.registered')
  async handleRegistered(event: { userId: string; referralCode?: string }): Promise<void> {
    if (event.referralCode) {
      await this.referrals.recordSignup(event.userId, event.referralCode);
    }
  }

  @OnEvent('user.email_verified')
  async handleEmailVerified(event: { userId: string }): Promise<void> {
    await this.referrals.qualify(event.userId);
  }
}
