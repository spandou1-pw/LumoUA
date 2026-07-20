/**
 * Platform-level roles (doc 24 — Authorization).
 * Scoped, per-community roles (doc 24 "Future: Community Roles") are modeled
 * separately on CommunityMember, not here — this enum is platform-wide only.
 */
export enum PlatformRole {
  USER = 'user',
  MODERATOR = 'moderator',
  ADMIN = 'admin',
}
