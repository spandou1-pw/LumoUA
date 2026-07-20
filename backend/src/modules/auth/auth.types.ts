import { PlatformRole } from '../../common/enums/role.enum';

/** Shape of the decoded, validated access-token payload attached to req.user (doc 23). */
export interface AuthenticatedUser {
  id: string;
  username: string;
  role: PlatformRole;
  deviceId?: string;
}

export interface AccessTokenPayload {
  sub: string; // user id
  username: string;
  role: PlatformRole;
  deviceId?: string;
}

/** doc SESSIONS.md: populated from request headers at login/refresh time — never trusted for authorization, only for display in the user's session list. */
export interface DeviceMeta {
  deviceName?: string;
  platform?: string;
  ipAddress?: string;
}
