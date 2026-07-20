import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY } from '../decorators/roles.decorator';
import { PlatformRole } from '../enums/role.enum';
import { AuthenticatedUser } from '../../modules/auth/auth.types';

/**
 * Enforces @Roles(...) metadata against the authenticated user's platform role.
 * Runs after JwtAuthGuard (req.user must already be populated).
 * doc 24: moderator has a strict subset of admin's platform-level power —
 * this guard only checks "is the role in the allowed set," the narrower
 * per-endpoint restrictions (e.g. moderator cannot change user status) are
 * expressed by which roles are actually listed in @Roles() at each route.
 */
@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<PlatformRole[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (!requiredRoles || requiredRoles.length === 0) return true;

    const request = context.switchToHttp().getRequest();
    const user: AuthenticatedUser | undefined = request.user;
    if (!user || !requiredRoles.includes(user.role)) {
      throw new ForbiddenException('INSUFFICIENT_ROLE');
    }
    return true;
  }
}
