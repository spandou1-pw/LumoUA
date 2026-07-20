import { create } from 'zustand';

interface AuthState {
  status: 'checking' | 'authenticated' | 'unauthenticated';
  userId: string | null;
  username: string | null;
  setAuthenticated: (userId: string, username: string) => void;
  setUnauthenticated: () => void;
}

/**
 * doc 17: local/UI state (Zustand) vs. server state (React Query) split —
 * this store holds only the minimal "am I logged in and who am I"
 * fact, never full profile data (that's fetched/cached via React Query
 * from GET /users/me, see api/hooks/useProfile.ts).
 */
export const useAuthStore = create<AuthState>((set) => ({
  status: 'checking',
  userId: null,
  username: null,
  setAuthenticated: (userId, username) => set({ status: 'authenticated', userId, username }),
  setUnauthenticated: () => set({ status: 'unauthenticated', userId: null, username: null }),
}));
