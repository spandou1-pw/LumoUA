import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { AuthenticatedUser } from '../../modules/auth/auth.types';

/**
 * @CurrentUser() userId: string
 * @CurrentUser('role') role: PlatformRole
 * Populated by JwtAuthGuard from the validated access token payload (doc 23).
 */
export const CurrentUser = createParamDecorator(
  (field: keyof AuthenticatedUser | undefined, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    const user: AuthenticatedUser = request.user;
    return field ? user?.[field] : user;
  },
);
