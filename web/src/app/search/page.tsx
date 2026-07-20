'use client';

import React, { useState, useCallback, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { AppShell } from '../../components/AppShell';
import { Button, EmptyState, Skeleton } from '../../components/ui';
import { useMutation, useQuery } from '@tanstack/react-query';
import { api } from '../../api/client';

function Avatar({ name, url, size = 40 }: { name: string; url: string | null; size?: number }) {
  if (url) {
    return <img src={url} alt={name} style={{ width: size, height: size, borderRadius: '50%', objectFit: 'cover' }} />;
  }
  return (
    <div style={{ width: size, height: size, borderRadius: '50%', background: 'var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 700, fontSize: size * 0.4 }}>
      {name.charAt(0).toUpperCase()}
    </div>
  );
}

function VerifiedBadge({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="var(--accent)" style={{ flexShrink: 0 }}>
      <path d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" stroke="white" strokeWidth="2" fill="var(--accent)" />
    </svg>
  );
}

function SearchBar({ value, onChange, placeholder, autoFocus }: { value: string; onChange: (v: string) => void; placeholder: string; autoFocus?: boolean }) {
  const inputRef = useRef<HTMLInputElement>(null);
  return (
    <div className="search-bar-wrap">
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--text-tertiary)" strokeWidth="2" strokeLinecap="round" style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)' }}>
        <circle cx="11" cy="11" r="8" />
        <line x1="21" y1="21" x2="16.65" y2="16.65" />
      </svg>
      <input
        ref={inputRef}
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        autoFocus={autoFocus}
        className="search-bar-input"
      />
      {value && (
        <button className="search-bar-clear" onClick={() => onChange('')}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>
      )}
      <style jsx>{`
        .search-bar-wrap { position: relative; display: flex; align-items: center; }
        .search-bar-input {
          width: 100%; height: 48px; padding: 0 40px 0 44px;
          background: var(--fill); border: 1.5px solid var(--border);
          border-radius: var(--radius-lg); font-size: 15px; color: var(--text);
          outline: none; transition: border-color var(--duration-fast) var(--ease-smooth);
        }
        .search-bar-input:focus { border-color: var(--accent); }
        .search-bar-input::placeholder { color: var(--text-tertiary); }
        .search-bar-clear {
          position: absolute; right: 12px; top: 50%; transform: translateY(-50%);
          display: flex; align-items: center; justify-content: center;
          width: 24px; height: 24px; border-radius: 50%;
          border: none; background: var(--fill-hover); color: var(--text-tertiary);
          cursor: pointer; transition: all var(--duration-fast) var(--ease-smooth);
        }
        .search-bar-clear:hover { background: var(--border); color: var(--text); }
      `}</style>
    </div>
  );
}

function TabBar({ tabs, active, onChange }: { tabs: { key: string; label: string; count?: number }[]; active: string; onChange: (k: string) => void }) {
  return (
    <div className="tab-bar">
      {tabs.map((t) => (
        <button key={t.key} className={`tab-item ${active === t.key ? 'active' : ''}`} onClick={() => onChange(t.key)}>
          {t.label}{t.count !== undefined ? ` (${t.count})` : ''}
        </button>
      ))}
      <style jsx>{`
        .tab-bar { display: flex; gap: 0; border-bottom: 1px solid var(--border); overflow-x: auto; }
        .tab-item {
          flex: 1; padding: 12px 8px; font-size: 14px; font-weight: 600;
          color: var(--text-tertiary); background: none; border: none;
          border-bottom: 2px solid transparent; cursor: pointer;
          transition: all var(--duration-fast) var(--ease-smooth);
          white-space: nowrap; text-align: center;
        }
        .tab-item:hover { color: var(--text-secondary); }
        .tab-item.active { color: var(--accent); border-bottom-color: var(--accent); }
      `}</style>
    </div>
  );
}

const RECENT_SEARCHES_KEY = 'lumoua_recent_searches';

function getRecentSearches(): string[] {
  if (typeof window === 'undefined') return [];
  try { return JSON.parse(localStorage.getItem(RECENT_SEARCHES_KEY) || '[]'); } catch { return []; }
}

function saveRecentSearch(query: string) {
  const searches = getRecentSearches().filter((s) => s !== query);
  searches.unshift(query);
  localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(searches.slice(0, 10)));
}

function removeRecentSearch(query: string) {
  localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(getRecentSearches().filter((s) => s !== query)));
}

function clearRecentSearches() {
  localStorage.removeItem(RECENT_SEARCHES_KEY);
}

interface SearchResult {
  id: string;
  username: string;
  displayName: string;
  avatarUrl: string | null;
  bio?: string | null;
  isVerified?: boolean;
  isFollowing?: boolean;
}

function useSearchUsers(query: string) {
  return useQuery<SearchResult[]>({
    queryKey: ['search', query],
    queryFn: () => api.get<SearchResult[]>(`/users/search?q=${encodeURIComponent(query)}`),
    enabled: query.length >= 2,
    placeholderData: (prev) => prev,
  });
}

function useFollowUser() {
  return useMutation({ mutationFn: (userId: string) => api.post(`/users/${userId}/follow`) });
}

function useUnfollowUser() {
  return useMutation({ mutationFn: (userId: string) => api.delete(`/users/${userId}/follow`) });
}

function UserResult({ user, onNavigate }: { user: SearchResult; onNavigate: () => void }) {
  const follow = useFollowUser();
  const unfollow = useUnfollowUser();
  const [isFollowing, setIsFollowing] = useState(user.isFollowing ?? false);

  useEffect(() => { setIsFollowing(user.isFollowing ?? false); }, [user.isFollowing]);

  const handleFollow = () => {
    if (isFollowing) {
      unfollow.mutate(user.id, { onSuccess: () => setIsFollowing(false) });
    } else {
      follow.mutate(user.id, { onSuccess: () => setIsFollowing(true) });
    }
  };

  return (
    <button className="user-result" onClick={onNavigate}>
      <Avatar name={user.displayName} url={user.avatarUrl} size={52} />
      <div className="user-result-info">
        <div className="user-result-name-row">
          <span className="user-result-name">{user.displayName}</span>
          {user.isVerified && <VerifiedBadge size={16} />}
        </div>
        <span className="user-result-username">@{user.username}</span>
        {user.bio && <span className="user-result-bio">{user.bio}</span>}
      </div>
      <div className="user-result-action" onClick={(e) => e.stopPropagation()}>
        <Button
          label={isFollowing ? 'Стежите' : 'Стежити'}
          variant={isFollowing ? 'secondary' : 'primary'}
          onClick={handleFollow}
          loading={follow.isPending || unfollow.isPending}
        />
      </div>
      <style jsx>{`
        .user-result {
          display: flex; align-items: center; gap: 14px;
          padding: 14px 16px; width: 100%; text-align: left;
          border: none; background: none; cursor: pointer;
          border-radius: var(--radius-lg);
          transition: background var(--duration-fast) var(--ease-smooth);
          animation: fadeInUp 0.25s var(--ease-smooth) both;
        }
        .user-result:hover { background: var(--fill); }
        .user-result-info { flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 2px; }
        .user-result-name-row { display: flex; align-items: center; gap: 5px; }
        .user-result-name { font-weight: 700; font-size: 15px; color: var(--text); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
        .user-result-username { font-size: 13px; color: var(--text-tertiary); font-weight: 500; }
        .user-result-bio { font-size: 13px; color: var(--text-secondary); margin-top: 3px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; max-width: 320px; line-height: 1.4; }
        .user-result-action { flex-shrink: 0; }
      `}</style>
    </button>
  );
}

function LoadingSkeleton() {
  return (
    <div className="loading-skeletons">
      {[1, 2, 3, 4, 5].map((i) => (
        <div key={i} className="skeleton-row" style={{ animationDelay: `${i * 0.06}s` }}>
          <Skeleton width="52px" height={52} />
          <div className="skeleton-text">
            <Skeleton width="160px" height={16} />
            <Skeleton width="100px" height={12} />
          </div>
        </div>
      ))}
      <style jsx>{`
        .loading-skeletons { display: flex; flex-direction: column; gap: 4px; padding: 8px 0; }
        .skeleton-row { display: flex; align-items: center; gap: 14px; padding: 14px 16px; border-radius: var(--radius-lg); animation: fadeIn 0.3s var(--ease-smooth) both; }
        .skeleton-text { flex: 1; display: flex; flex-direction: column; gap: 6px; }
      `}</style>
    </div>
  );
}

export default function SearchPage() {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [debounced, setDebounced] = useState('');
  const [activeTab, setActiveTab] = useState('people');
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const { data, isLoading, isError, error } = useSearchUsers(debounced);

  useEffect(() => { setRecentSearches(getRecentSearches()); }, []);

  useEffect(() => {
    if (debounced.length >= 2 && data && data.length > 0) {
      saveRecentSearch(debounced);
      setRecentSearches(getRecentSearches());
    }
  }, [debounced, data]);

  const handleInput = useCallback((val: string) => {
    setQuery(val);
    if (timerRef.current) clearTimeout(timerRef.current);
    if (val.trim().length < 2) { setDebounced(''); return; }
    timerRef.current = setTimeout(() => setDebounced(val.trim()), 300);
  }, []);

  const tabs = [
    { key: 'people', label: 'Люди', count: debounced.length >= 2 && data ? data.length : undefined },
    { key: 'communities', label: 'Спільноти' },
    { key: 'posts', label: 'Публікації' },
  ];

  const hasQuery = debounced.length >= 2;
  const showResults = hasQuery && !isLoading;
  const noResults = showResults && data && data.length === 0;
  const hasResults = showResults && data && data.length > 0;

  return (
    <AppShell>
      <div className="search-page">
        <header className="search-header">
          <h1 className="search-title">Пошук</h1>
        </header>

        <SearchBar value={query} onChange={handleInput} placeholder="Шукати людей, спільноти, публікації..." autoFocus />

        <TabBar tabs={tabs} active={activeTab} onChange={setActiveTab} />

        {activeTab === 'people' && (
          <div className="tab-content">
            {isLoading && hasQuery && <LoadingSkeleton />}
            {isError && (
              <div className="error-banner">
                <span>{(error as Error)?.message || 'Помилка під час пошуку. Спробуйте ще раз.'}</span>
              </div>
            )}
            {noResults && (
              <EmptyState title="Нічого не знайдено" message={`За запитом «${debounced}» нічого не знайдено.`} />
            )}
            {hasResults && (
              <div className="results-list">
                <div className="results-count">Знайдено {data!.length} {data!.length === 1 ? 'користувача' : 'користувачів'}</div>
                {data!.map((user, i) => (
                  <div key={user.id} style={{ animationDelay: `${i * 0.04}s` }}>
                    <UserResult user={user} onNavigate={() => router.push(`/profile?user=${user.username}`)} />
                  </div>
                ))}
              </div>
            )}
            {!hasQuery && !isLoading && (
              <div className="initial-state">
                {recentSearches.length > 0 ? (
                  <div className="recent-section">
                    <div className="recent-header">
                      <h2 className="recent-title">Нещодавні запити</h2>
                      <button className="recent-clear-all" onClick={() => { clearRecentSearches(); setRecentSearches([]); }}>Очистити все</button>
                    </div>
                    <div className="recent-list">
                      {recentSearches.map((s) => (
                        <div key={s} className="recent-item">
                          <button className="recent-item-btn" onClick={() => { setQuery(s); setDebounced(s); }}>
                            <span>{s}</span>
                          </button>
                          <button className="recent-remove" onClick={(e) => { e.stopPropagation(); removeRecentSearch(s); setRecentSearches(getRecentSearches()); }}>
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                              <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                            </svg>
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <EmptyState title="Знайдіть людей" message="Шукайте користувачів за ім'ям або нікнеймом" />
                )}
              </div>
            )}
          </div>
        )}

        {activeTab !== 'people' && (
          <EmptyState title="Незабаром" message="Ця функція буде доступна незабаром" />
        )}
      </div>

      <style jsx>{`
        .search-page { display: flex; flex-direction: column; gap: 16px; padding-top: 16px; animation: fadeIn 0.3s var(--ease-smooth); max-width: 680px; margin: 0 auto; width: 100%; }
        .search-header { padding: 0 4px; }
        .search-title { font-size: 28px; font-weight: 800; letter-spacing: -0.03em; color: var(--text); }
        .tab-content { animation: fadeIn 0.2s var(--ease-smooth); min-height: 200px; }
        .error-banner { display: flex; align-items: center; gap: 10px; padding: 14px 18px; border-radius: var(--radius-lg); background: var(--fill); color: var(--text-secondary); font-size: 14px; font-weight: 500; }
        .results-list { display: flex; flex-direction: column; gap: 2px; }
        .results-count { font-size: 12px; font-weight: 600; color: var(--text-tertiary); padding: 4px 16px 8px; text-transform: uppercase; letter-spacing: 0.05em; }
        .initial-state { padding-top: 8px; }
        .recent-section { animation: fadeIn 0.3s var(--ease-smooth); }
        .recent-header { display: flex; align-items: center; justify-content: space-between; padding: 0 4px; margin-bottom: 8px; }
        .recent-title { font-size: 15px; font-weight: 700; color: var(--text); }
        .recent-clear-all { font-size: 13px; font-weight: 600; color: var(--accent); background: none; border: none; cursor: pointer; padding: 4px 8px; border-radius: var(--radius-sm); }
        .recent-list { display: flex; flex-direction: column; gap: 2px; }
        .recent-item { display: flex; align-items: center; border-radius: var(--radius-md); transition: background var(--duration-fast) var(--ease-smooth); }
        .recent-item:hover { background: var(--fill); }
        .recent-item-btn { flex: 1; display: flex; align-items: center; gap: 12px; padding: 10px 12px; border: none; background: none; font-size: 14px; color: var(--text); cursor: pointer; text-align: left; }
        .recent-remove { display: flex; align-items: center; justify-content: center; width: 28px; height: 28px; border-radius: 50%; border: none; background: none; color: var(--text-tertiary); cursor: pointer; margin-right: 8px; flex-shrink: 0; opacity: 0; transition: all var(--duration-fast) var(--ease-smooth); }
        .recent-item:hover .recent-remove { opacity: 1; }
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes fadeInUp { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
      `}</style>
    </AppShell>
  );
}
