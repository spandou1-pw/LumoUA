import { useQuery } from '@tanstack/react-query';
import { api } from '../client';

export interface Me {
  id: string;
  username: string;
  displayName: string;
  avatarUrl: string | null;
  bio: string | null;
  isPrivate: boolean;
  isVerified: boolean;
}

export function useMe() {
  return useQuery({ queryKey: ['me'], queryFn: () => api.get<Me>('/users/me') });
}

export interface ProfileCustomizationDisplay {
  isPremium: boolean;
  cosmetics: Record<string, { id: string; assetUrl: string | null; config: Record<string, unknown> } | null>;
  status: { text: string | null; emoji: string | null; icon: unknown };
  animatedProfileEnabled: boolean;
  videoAvatarAssetId: string | null;
  showcases: { gifts: unknown[]; badges: unknown[]; achievements: unknown[] };
}

/** doc PROFILE.md "Premium Showcase" — the full profile customization bundle in one call. */
export function useProfileCustomization(userId: string | undefined) {
  return useQuery({
    queryKey: ['profile-customization', userId],
    queryFn: () => api.get<ProfileCustomizationDisplay>(`/profile-customization/${userId}`),
    enabled: !!userId,
  });
}
