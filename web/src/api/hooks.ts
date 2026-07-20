'use client';

import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api, ApiError, setSession, clearSession } from './client';

// ---------- Auth ----------

export function useLogin() {
  return useMutation({
    mutationFn: async (input: { email: string; password: string }) => {
      const deviceId = typeof window !== 'undefined' ? localStorage.getItem('lumo_device_id') ?? 'web' : 'web';
      return api.post<{ accessToken: string; refreshToken: string; userId: string }>(
        '/auth/login',
        { ...input, deviceId },
        { auth: false },
      );
    },
    onSuccess: (data) => setSession(data.accessToken, data.refreshToken),
  });
}

export function useRegister() {
  return useMutation({
    mutationFn: (input: { email: string; password: string }) =>
      api.post<{ userId: string }>('/auth/register', input, { auth: false }),
  });
}

export function useVerifyEmail() {
  return useMutation({
    mutationFn: (input: { email: string; code: string }) =>
      api.post<{ verified: boolean }>('/auth/verify-email', input, { auth: false }),
  });
}

export function useLogout() {
  return useMutation({
    mutationFn: () => api.post('/auth/logout'),
    onSettled: () => clearSession(),
  });
}

// ---------- Feed ----------

export interface Post {
  id: string;
  authorId: string;
  body: string | null;
  createdAt: string;
  likeCount: number;
  commentCount: number;
  viewerHasLiked: boolean;
}

export function useFeed() {
  return useInfiniteQuery({
    queryKey: ['feed', 'following'],
    queryFn: ({ pageParam }) =>
      api.get<{ items: Post[]; nextCursor: string | null }>(
        `/feed/following${pageParam ? `?cursor=${encodeURIComponent(pageParam)}` : ''}`,
      ),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (last) => last.nextCursor ?? undefined,
    staleTime: 30_000,
  });
}

export function useLikePost() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (postId: string) => api.post(`/posts/${postId}/like`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['feed'] }),
  });
}

// ---------- Profile ----------

export interface Me {
  id: string;
  username: string;
  displayName: string;
  avatarUrl: string | null;
  bio: string | null;
}

export function useMe() {
  return useQuery({ queryKey: ['me'], queryFn: () => api.get<Me>('/users/me') });
}

// ---------- Wallet ----------

export function useWalletBalance() {
  return useQuery({
    queryKey: ['wallet', 'balance'],
    queryFn: () => api.get<{ coinBalance: string; locked: boolean }>('/wallet/balance'),
  });
}

export { ApiError };

// ---------- User lookup (exact username — full search isn't built yet) ----------

export interface PublicUser {
  id: string;
  username: string;
  displayName: string;
  avatarUrl: string | null;
}

export function useUserLookup() {
  return useMutation({
    mutationFn: (username: string) => api.get<PublicUser>(`/users/${encodeURIComponent(username)}`),
  });
}

// ---------- Payments (real Stripe Checkout redirect) ----------

export interface CoinPack {
  id: string;
  name: string;
  coinAmount: string;
  priceUsdCents: number;
}

export interface PremiumPlan {
  id: string;
  name: string;
  priceUsdCents: number;
  interval: string;
}

export function useCoinPacks() {
  return useQuery({ queryKey: ['payments', 'coin-packs'], queryFn: () => api.get<CoinPack[]>('/payments/catalog/coins') });
}

export function usePremiumPlans() {
  return useQuery({ queryKey: ['payments', 'premium-plans'], queryFn: () => api.get<PremiumPlan[]>('/payments/catalog/premium') });
}

/** doc PAYMENTS.md: creates a real Stripe Checkout session and returns a real redirect URL — this is the actual, working purchase flow (Stripe is the one fully-wired payment provider in this codebase). */
export function useCreateCheckout() {
  return useMutation({
    mutationFn: (input: { productId: string; productType: 'coins' | 'premium' }) =>
      api.post<{ checkoutUrl: string; sessionId: string }>('/payments/stripe/checkout-session', input),
  });
}

// ---------- Premium ----------

export interface PremiumStatus {
  isPremium: boolean;
  planKey: string | null;
  renewsAt: string | null;
}

export interface CosmeticItem {
  id: string;
  name: string;
  category: string;
  rarity?: string;
  isAnimated: boolean;
  requiresPremium: boolean;
}

export function usePremiumStatus() {
  return useQuery({ queryKey: ['premium', 'status'], queryFn: () => api.get<PremiumStatus>('/premium/status') });
}

export function useCosmeticCatalog(category: string) {
  return useQuery({
    queryKey: ['premium', 'cosmetics', category],
    queryFn: () => api.get<CosmeticItem[]>(`/premium/cosmetics/${category}/catalog`),
  });
}

export function useSelectCosmetic() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (cosmeticItemId: string) => api.post('/premium/cosmetics/select', { cosmeticItemId }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['premium'] }),
  });
}

// ---------- Gift Store ----------

export interface GiftCatalogItem {
  id: string;
  name: string;
  coinCost: string;
  rarity: 'common' | 'rare' | 'legendary';
  isAnimated: boolean;
}

export function useGiftStore(rarity?: string) {
  return useQuery({
    queryKey: ['gifts', 'store', rarity],
    queryFn: () => api.get<GiftCatalogItem[]>(`/gifts/store${rarity ? `?rarity=${rarity}` : ''}`),
  });
}

export function useSendGift() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: { recipientId: string; giftCatalogItemId: string }) => api.post('/gifts/send', input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['wallet'] }),
  });
}

// ---------- Notifications ----------

export interface NotificationItem {
  id: string;
  title: string;
  body: string;
  readAt: string | null;
  createdAt: string;
}

export function useNotifications() {
  return useQuery({
    queryKey: ['notifications'],
    queryFn: () => api.get<{ items: NotificationItem[] }>('/notifications'),
    refetchInterval: 30_000,
  });
}

// ---------- Conversations (metadata only — see ConversationsPage for the E2E note) ----------

export interface Conversation {
  id: string;
  participantIds: string[];
  lastMessageAt: string | null;
  unreadCount: number;
}

export function useConversations() {
  return useQuery({ queryKey: ['conversations'], queryFn: () => api.get<{ items: Conversation[] }>('/conversations') });
}
