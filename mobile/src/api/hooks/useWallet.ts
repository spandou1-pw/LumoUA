import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api, ApiError } from '../client';

export function useWalletBalance() {
  return useQuery({
    queryKey: ['wallet', 'balance'],
    queryFn: () => api.get<{ coinBalance: string; locked: boolean }>('/wallet/balance'),
    refetchInterval: 30_000, // balance should feel "live" without a socket for it
  });
}

interface WalletTransaction {
  id: string;
  type: string;
  amount: string;
  balanceAfter: string;
  createdAt: string;
}

export function useWalletTransactions() {
  return useInfiniteQuery({
    queryKey: ['wallet', 'transactions'],
    queryFn: ({ pageParam }) =>
      api.get<{ items: WalletTransaction[]; nextCursor: string | null }>(
        `/wallet/transactions${pageParam ? `?cursor=${encodeURIComponent(pageParam)}` : ''}`,
      ),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (last) => last.nextCursor ?? undefined,
  });
}

export function useTransferCoins() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: { recipientId: string; amount: number; message?: string }) =>
      api.post('/wallet/transfer', input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['wallet'] });
    },
    // doc COINS.md: surfaces specific error codes (DAILY_TRANSFER_LIMIT_EXCEEDED,
    // WALLET_LOCKED, INSUFFICIENT_COIN_BALANCE) distinctly rather than one generic
    // failure message — the screen maps `error.code` to tailored copy.
  });
}

export function useCoinPacks() {
  return useQuery({
    queryKey: ['payments', 'coin-packs'],
    queryFn: () => api.get<{ id: string; name: string; coinAmount: string; priceUsdCents: number }[]>('/payments/catalog/coins'),
  });
}

export { ApiError };
