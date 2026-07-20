import { useAuthStore } from '../src/store/authStore';

describe('authStore', () => {
  beforeEach(() => {
    useAuthStore.setState({ status: 'checking', userId: null, username: null });
  });

  it('starts in the checking state', () => {
    expect(useAuthStore.getState().status).toBe('checking');
  });

  it('setAuthenticated transitions to authenticated with the given user info', () => {
    useAuthStore.getState().setAuthenticated('user-1', 'ivan');
    const state = useAuthStore.getState();
    expect(state.status).toBe('authenticated');
    expect(state.userId).toBe('user-1');
    expect(state.username).toBe('ivan');
  });

  it('setUnauthenticated clears any previously-set user info', () => {
    useAuthStore.getState().setAuthenticated('user-1', 'ivan');
    useAuthStore.getState().setUnauthenticated();
    const state = useAuthStore.getState();
    expect(state.status).toBe('unauthenticated');
    expect(state.userId).toBeNull();
    expect(state.username).toBeNull();
  });
});
