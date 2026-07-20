import { SetMetadata } from '@nestjs/common';
import { PlatformRole } from '../enums/role.enum';

export const ROLES_KEY = 'roles';

/**
 * @Roles(PlatformRole.ADMIN) — used with RolesGuard (doc 24 enforcement pattern).
 * A route with no @Roles() decorator is accessible to any authenticated user;
 * RolesGuard only restricts routes that explicitly declare required roles.
 */
export const Roles = (...roles: PlatformRole[]) => SetMetadata(ROLES_KEY, roles);
