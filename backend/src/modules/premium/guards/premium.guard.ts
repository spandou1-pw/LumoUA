import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  SetMetadata,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { SubscriptionsService } from '../../subscriptions/subscriptions.service';

export const REQUIRES_PREMIUM_KEY = 'requiresPremium';

/** Marks a route as requiring an active premium subscription (doc PREMIUM.md). */
export const RequiresPremium = () => SetMetadata(REQUIRES_PREMIUM_KEY, true);

/**
 * Single source of truth for "is this user premium right now" — every
 * premium-gated action checks live subscription status (doc 6), never a
 * cached/client-supplied flag. A lapsed subscription immediately loses
 * access to premium-exclusive actions on the next request, no separate
 * sync step needed.
 */
@Injectable()
export class PremiumGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly subscriptions: SubscriptionsService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requiresPremium = this.reflector.getAllAndOverride<boolean>(REQUIRES_PREMIUM_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (!requiresPremium) return true;

    const request = context.switchToHttp().getRequest();
    const userId = request.user?.id;
    const activeSub = userId ? await this.subscriptions.getActiveForUser(userId) : null;
    if (!activeSub) {
      throw new ForbiddenException('PREMIUM_SUBSCRIPTION_REQUIRED');
    }
    return true;
  }
}
