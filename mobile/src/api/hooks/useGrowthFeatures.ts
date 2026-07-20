import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '../client';

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
  assetUrl: string | null;
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
  iconUrl: string;
  rarity: 'common' | 'rare' | 'legendary';
  isAnimated: boolean;
  seasonTag: string | null;
}

export function useGiftStore(filters?: { rarity?: string; categoryId?: string }) {
  const qs = new URLSearchParams(filters as Record<string, string>).toString();
  return useQuery({
    queryKey: ['gifts', 'store', filters],
    queryFn: () => api.get<GiftCatalogItem[]>(`/gifts/store${qs ? `?${qs}` : ''}`),
  });
}

export function useSendGift() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: { recipientId: string; giftCatalogItemId: string; message?: string }) =>
      api.post('/gifts/send', input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['wallet'] });
      queryClient.invalidateQueries({ queryKey: ['gifts'] });
    },
  });
}

// ---------- Notifications ----------

export interface NotificationItem {
  id: string;
  type: string;
  title: string;
  body: string;
  readAt: string | null;
  createdAt: string;
}

export function useNotifications() {
  return useInfiniteQuery({
    queryKey: ['notifications'],
    queryFn: ({ pageParam }) =>
      api.get<{ items: NotificationItem[]; nextCursor: string | null }>(
        `/notifications${pageParam ? `?cursor=${encodeURIComponent(pageParam)}` : ''}`,
      ),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (last) => last.nextCursor ?? undefined,
    refetchInterval: 30_000,
  });
}

// ---------- Messenger (metadata only) ----------

export interface Conversation {
  id: string;
  participantIds: string[];
  lastMessageAt: string | null;
  unreadCount: number;
}

/**
 * doc LAUNCH_READINESS.md: conversation *metadata* (participants, last
 * activity, unread count) comes from the real backend. Message *content*
 * is end-to-end encrypted (doc 26/31) and this client has no Signal
 * Protocol implementation yet — so this screen can show who you're
 * talking to and when, but not decrypt what was said. Wiring a real
 * crypto library (e.g. libsignal-client) is the flagged next step, not
 * silently skipped.
 */
export function useConversations() {
  return useQuery({
    queryKey: ['conversations'],
    queryFn: () => api.get<{ items: Conversation[] }>('/conversations'),
  });
}
