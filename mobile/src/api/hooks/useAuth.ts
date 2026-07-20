import { useMutation } from '@tanstack/react-query';
import { api, setSession, clearSession, getOrCreateDeviceId } from '../client';
import { useAuthStore } from '../../store/authStore';

interface TokenPair {
  accessToken: string;
  refreshToken: string;
  userId: string;
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

export function useResendVerification() {
  return useMutation({
    mutationFn: (email: string) => api.post('/auth/verify-email/resend', { email }, { auth: false }),
  });
}

export function useLogin() {
  const setAuthenticated = useAuthStore((s) => s.setAuthenticated);

  return useMutation({
    mutationFn: async (input: { email: string; password: string }) => {
      const deviceId = await getOrCreateDeviceId();
      return api.post<TokenPair>('/auth/login', { ...input, deviceId }, { auth: false });
    },
    onSuccess: async (data) => {
      await setSession(data.accessToken, data.refreshToken);
      // doc 17: username isn't in the token response — a quick follow-up
      // GET /users/me hydrates it; simplified here to userId-only for the
      // store, screens needing the username read it via useProfile().
      setAuthenticated(data.userId, '');
    },
  });
}

export function useLogout() {
  const setUnauthenticated = useAuthStore((s) => s.setUnauthenticated);

  return useMutation({
    mutationFn: () => api.post('/auth/logout'),
    onSettled: async () => {
      // doc 23: logout clears local session even if the network call fails
      // (e.g. offline) — the user's intent to log out shouldn't be blocked
      // by connectivity; the server-side token will simply expire naturally.
      await clearSession();
      setUnauthenticated();
    },
  });
}
