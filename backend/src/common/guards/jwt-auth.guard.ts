import { ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Reflector } from '@nestjs/core';
import { GqlExecutionContext } from '@nestjs/graphql';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';

/**
 * Validates the Authorization: Bearer <access_token> header (doc 22/23).
 * Applied globally in main.ts as the default guard; individual routes can
 * opt out with @Public() where genuinely unauthenticated (e.g. login/register).
 */
@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  constructor(private readonly reflector: Reflector) {
    super();
  }

  canActivate(context: ExecutionContext) {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) return true;
    return super.canActivate(context);
  }

  handleRequest<TUser = unknown>(err: unknown, user: TUser): TUser {
    if (err || !user) {
      throw new UnauthorizedException('INVALID_OR_EXPIRED_TOKEN');
    }
    return user;
  }

  getRequest(context: ExecutionContext) {
    // doc 22: feed/search are GraphQL — this guard must authenticate both
    // transports identically rather than duplicating auth logic per-resolver.
    const gqlCtx = GqlExecutionContext.create(context);
    const gqlReq = gqlCtx.getContext()?.req;
    return gqlReq ?? context.switchToHttp().getRequest();
  }
}
