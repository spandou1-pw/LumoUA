import { Controller, Get, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { SubscriptionsService } from './subscriptions.service';

@ApiTags('Subscriptions')
@ApiBearerAuth()
@Controller('subscriptions')
export class SubscriptionsController {
  constructor(private readonly subscriptionsService: SubscriptionsService) {}

  @Get('me')
  @ApiOperation({ summary: 'Current active premium subscription, if any' })
  async me(@CurrentUser('id') userId: string) {
    const sub = await this.subscriptionsService.getActiveForUser(userId);
    return sub ?? { active: false };
  }

  @Post('cancel')
  @ApiOperation({
    summary:
      'Cancel at period end. For Stripe this also calls the Stripe API (doc: PaymentsController wires that call); ' +
      'Apple/Google subscriptions must be canceled by the user in their respective store, per platform policy — this ' +
      'endpoint records intent but cannot force-cancel an Apple/Google subscription server-side.',
  })
  async cancel(@CurrentUser('id') userId: string) {
    return this.subscriptionsService.cancelViaStripe(userId);
  }
}
