'use client';

import React, { useState, useCallback, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import AppShell from '../../components/AppShell';
import { Avatar, Button, VerifiedBadge, SearchBar, TabBar, EmptyState, Skeleton, Card } from '../../components/ui';
import { useSearchUsers, useFollowUser, useUnfollowUser } from '../../api/hooks';

const RECENT_SEARCHES_KEY = 'lumoua_recent_searches';

function getRecentSearches(): string[] {
  if (typeof window === 'undefined') return [];
  try {
    return JSON.parse(localStorage.getItem(RECENT_SEARCHES_KEY) || '[]');
  } catch {
    return [];
  }
}

function saveRecentSearch(query: string) {
  const searches = getRecentSearches().filter((s) => s !== query);
  searches.unshift(query);
  localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(searches.slice(0, 10)));
}

function removeRecentSearch(query: string) {
  const searches = getRecentSearches().filter((s) => s !== query);
  localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(searches));
}

function clearRecentSearches() {
  localStorage.removeItem(RECENT_SEARCHES_KEY);
}

function UserResult({ user, onNavigate }: { user: { id: string; username: string; displayName: string; avatarUrl: string | null; bio: string | null; isVerified: boolean; isFollowing: boolean }; onNavigate: () => void }) {
  const follow = useFollowUser();
  const unfollow = useUnfollowUser();
  const [isFollowing, setIsFollowing] = useState(user.isFollowing);

  useEffect(() => { setIsFollowing(user.isFollowing); }, [user.isFollowing]);

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
        {user.bio && (
          <span className="user-result-bio">{user.bio}</span>
        )}
      </div>
      <div className="user-result-action" onClick={(e) => e.stopPropagation()}>
        <Button
          label={isFollowing ? 'Стежите' : 'Стежити'}
          variant={isFollowing ? 'secondary' : 'primary'}
          size="sm"
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
        .user-result:focus-visible { outline: 2px solid var(--accent); outline-offset: -2px; }
        .user-result-info { flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 2px; }
        .user-result-name-row { display: flex; align-items: center; gap: 5px; }
        .user-result-name { font-weight: 700; font-size: 15px; color: var(--text); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
        .user-result-username { font-size: 13px; color: var(--text-tertiary); font-weight: 500; }
        .user-result-bio {
          font-size: 13px; color: var(--text-secondary); margin-top: 3px;
          overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
          max-width: 320px; line-height: 1.4;
        }
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
          <Skeleton width="52px" height="52px" radius="50%" />
          <div className="skeleton-text">
            <Skeleton width="160px" height="16px" />
            <Skeleton width="100px" height="12px" />
            <Skeleton width="220px" height="12px" />
          </div>
          <Skeleton width="80px" height="34px" radius="var(--radius-full)" />
        </div>
      ))}
      <style jsx>{`
        .loading-skeletons { display: flex; flex-direction: column; gap: 4px; padding: 8px 0; }
        .skeleton-row {
          display: flex; align-items: center; gap: 14px;
          padding: 14px 16px; border-radius: var(--radius-lg);
          animation: fadeIn 0.3s var(--ease-smooth) both;
        }
        .skeleton-text { flex: 1; display: flex; flex-direction: column; gap: 6px; }
      `}</style>
    </div>
  );
}

function PlaceholderTab({ icon, title, message }: { icon: React.ReactNode; title: string; message: string }) {
  return (
    <div className="placeholder-tab">
      <div className="placeholder-icon">{icon}</div>
      <p className="placeholder-title">{title}</p>
      <p className="placeholder-message">{message}</p>
      <style jsx>{`
        .placeholder-tab {
          display: flex; flex-direction: column; align-items: center;
          justify-content: center; padding: 80px 20px; text-align: center;
          animation: fadeIn 0.3s var(--ease-smooth);
        }
        .placeholder-icon {
          width: 80px; height: 80px; border-radius: 50%;
          background: var(--fill); display: flex;
          align-items: center; justify-content: center;
          margin-bottom: 20px;
        }
        .placeholder-title { font-size: 18px; font-weight: 700; color: var(--text); margin-bottom: 6px; }
        .placeholder-message { font-size: 14px; color: var(--text-tertiary); max-width: 280px; line-height: 1.5; }
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
  const [showKeyboardHint, setShowKeyboardHint] = useState(true);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const { data, isLoading, isError, error } = useSearchUsers(debounced);

  useEffect(() => {
    setRecentSearches(getRecentSearches());
  }, []);

  useEffect(() => {
    if (debounced.length >= 2 && data && data.length > 0) {
      saveRecentSearch(debounced);
      setRecentSearches(getRecentSearches());
    }
  }, [debounced, data]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === '/' && document.activeElement?.tagName !== 'INPUT') {
        e.preventDefault();
        inputRef.current?.focus();
      }
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => setShowKeyboardHint(false), 4000);
    return () => clearTimeout(timer);
  }, []);

  const handleInput = useCallback((val: string) => {
    setQuery(val);
    if (timerRef.current) clearTimeout(timerRef.current);
    if (val.trim().length < 2) {
      setDebounced('');
      return;
    }
    timerRef.current = setTimeout(() => setDebounced(val.trim()), 300);
  }, []);

  const handleClear = useCallback(() => {
    setQuery('');
    setDebounced('');
    inputRef.current?.focus();
  }, []);

  const handleRemoveRecent = useCallback((search: string) => {
    removeRecentSearch(search);
    setRecentSearches(getRecentSearches());
  }, []);

  const handleClearAllRecent = useCallback(() => {
    clearRecentSearches();
    setRecentSearches([]);
  }, []);

  const handleSelectRecent = useCallback((search: string) => {
    setQuery(search);
    setDebounced(search);
  }, []);

  const tabs = [
    { key: 'people', label: 'Люди', count: debounced.length >= 2 && data ? data.length : undefined },
    { key: 'communities', label: 'Спільноти' },
    { key: 'posts', label: 'Публікації' },
    { key: 'messages', label: 'Повідомлення' },
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

        <div className="search-input-wrapper">
          <SearchBar
            value={query}
            onChange={handleInput}
            placeholder="Шукати людей, спільноти, публікації..."
            autoFocus
            icon={
              <svg className="search-icon-animated" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--text-tertiary)" strokeWidth="2" strokeLinecap="round">
                <circle cx="11" cy="11" r="8" />
                <line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
            }
          />
          {showKeyboardHint && !query && (
            <div className="keyboard-hint">
              <kbd>/</kbd>
              <span>щоб почати пошук</span>
            </div>
          )}
        </div>

        <TabBar tabs={tabs} active={activeTab} onChange={setActiveTab} />

        {activeTab === 'people' && (
          <div className="tab-content">
            {isLoading && hasQuery && <LoadingSkeleton />}

            {isError && (
              <div className="error-banner">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--error)" strokeWidth="2" strokeLinecap="round">
                  <circle cx="12" cy="12" r="10" />
                  <line x1="15" y1="9" x2="9" y2="15" />
                  <line x1="9" y1="9" x2="15" y2="15" />
                </svg>
                <span>{error?.message || 'Помилка під час пошуку. Спробуйте ще раз.'}</span>
              </div>
            )}

            {noResults && (
              <EmptyState
                title="Нічого не знайдено"
                message={`За запитом «${debounced}» нічого не знайдено. Спробуйте інший пошуковий запит.`}
                icon={
                  <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="var(--text-tertiary)" strokeWidth="1.5" strokeLinecap="round">
                    <circle cx="11" cy="11" r="8" />
                    <line x1="21" y1="21" x2="16.65" y2="16.65" />
                  </svg>
                }
              />
            )}

            {hasResults && (
              <div className="results-list">
                <div className="results-count">
                  Знайдено {data.length} {data.length === 1 ? 'користувача' : data.length < 5 ? 'користувачів' : 'користувачів'}
                </div>
                {data.map((user, i) => (
                  <div key={user.id} style={{ animationDelay: `${i * 0.04}s` }}>
                    <UserResult
                      user={user}
                      onNavigate={() => router.push(`/profile?user=${user.username}`)}
                    />
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
                      <button className="recent-clear-all" onClick={handleClearAllRecent}>Очистити все</button>
                    </div>
                    <div className="recent-list">
                      {recentSearches.map((search) => (
                        <div key={search} className="recent-item">
                          <button className="recent-item-btn" onClick={() => handleSelectRecent(search)}>
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--text-tertiary)" strokeWidth="2" strokeLinecap="round">
                              <circle cx="12" cy="12" r="10" />
                              <polyline points="12 6 12 12 16 14" />
                            </svg>
                            <span>{search}</span>
                          </button>
                          <button
                            className="recent-remove"
                            onClick={(e) => { e.stopPropagation(); handleRemoveRecent(search); }}
                            title="Видалити"
                          >
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                              <line x1="18" y1="6" x2="6" y2="18" />
                              <line x1="6" y1="6" x2="18" y2="18" />
                            </svg>
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="empty-hint">
                    <div className="hint-icon-circle">
                      <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="var(--text-tertiary)" strokeWidth="1" strokeLinecap="round">
                        <circle cx="11" cy="11" r="8" />
                        <line x1="21" y1="21" x2="16.65" y2="16.65" />
                      </svg>
                    </div>
                    <p className="hint-title">Знайдіть людей</p>
                    <p className="hint-subtitle">Шукайте користувачів за ім'ям або нікнеймом</p>
                    <div className="hint-tip">
                      <kbd>/</kbd>
                      <span>почати пошук</span>
                      <span className="hint-separator">·</span>
                      <kbd>Esc</kbd>
                      <span>очистити</span>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {activeTab === 'communities' && (
          <PlaceholderTab
            icon={
              <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="var(--text-tertiary)" strokeWidth="1.5" strokeLinecap="round">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                <circle cx="9" cy="7" r="4" />
                <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                <path d="M16 3.13a4 4 0 0 1 0 7.75" />
              </svg>
            }
            title="Спільноти"
            message="Пошук спільнот буде доступний незабаром"
          />
        )}

        {activeTab === 'posts' && (
          <PlaceholderTab
            icon={
              <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="var(--text-tertiary)" strokeWidth="1.5" strokeLinecap="round">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                <polyline points="14 2 14 8 20 8" />
                <line x1="16" y1="13" x2="8" y2="13" />
                <line x1="16" y1="17" x2="8" y2="17" />
              </svg>
            }
            title="Публікації"
            message="Пошук публікацій буде доступний незабаром"
          />
        )}

        {activeTab === 'messages' && (
          <PlaceholderTab
            icon={
              <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="var(--text-tertiary)" strokeWidth="1.5" strokeLinecap="round">
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
              </svg>
            }
            title="Повідомлення"
            message="Пошук повідомлень буде доступний незабаром"
          />
        )}
      </div>

      <style jsx>{`
        .search-page {
          display: flex; flex-direction: column; gap: 16px;
          padding-top: 16px;
          animation: fadeIn 0.3s var(--ease-smooth);
          max-width: 680px;
          margin: 0 auto;
          width: 100%;
        }

        .search-header { padding: 0 4px; }
        .search-title {
          font-size: 28px; font-weight: 800; letter-spacing: -0.03em;
          background: linear-gradient(135deg, var(--text) 0%, var(--text-secondary) 100%);
          -webkit-background-clip: text; -webkit-text-fill-color: transparent;
          background-clip: text;
        }

        .search-input-wrapper { position: relative; }
        .search-icon-animated { transition: transform var(--duration) var(--ease-smooth); }
        .search-bar:focus-within .search-icon-animated { transform: scale(1.1); }

        .keyboard-hint {
          position: absolute; right: 14px; top: 50%; transform: translateY(-50%);
          display: flex; align-items: center; gap: 6px;
          font-size: 12px; color: var(--text-tertiary);
          pointer-events: none;
          animation: fadeIn 0.5s var(--ease-smooth) 1s both;
        }
        .keyboard-hint kbd {
          display: inline-flex; align-items: center; justify-content: center;
          min-width: 22px; height: 22px; padding: 0 6px;
          background: var(--bg-primary); border: 1px solid var(--border);
          border-radius: 5px; font-family: inherit; font-size: 11px; font-weight: 600;
          box-shadow: 0 1px 2px rgba(0,0,0,0.06);
        }

        .tab-content {
          animation: fadeIn 0.2s var(--ease-smooth);
          min-height: 200px;
        }

        .error-banner {
          display: flex; align-items: center; gap: 10px;
          padding: 14px 18px; border-radius: var(--radius-lg);
          background: var(--error-light); color: var(--error);
          font-size: 14px; font-weight: 500;
          animation: fadeInUp 0.25s var(--ease-smooth);
        }

        .results-list { display: flex; flex-direction: column; gap: 2px; }
        .results-count {
          font-size: 12px; font-weight: 600; color: var(--text-tertiary);
          padding: 4px 16px 8px; text-transform: uppercase; letter-spacing: 0.05em;
        }

        .initial-state { padding-top: 8px; }

        .recent-section { animation: fadeIn 0.3s var(--ease-smooth); }
        .recent-header {
          display: flex; align-items: center; justify-content: space-between;
          padding: 0 4px; margin-bottom: 8px;
        }
        .recent-title { font-size: 15px; font-weight: 700; color: var(--text); }
        .recent-clear-all {
          font-size: 13px; font-weight: 600; color: var(--accent);
          background: none; border: none; cursor: pointer;
          padding: 4px 8px; border-radius: var(--radius-sm);
          transition: background var(--duration-fast) var(--ease-smooth);
        }
        .recent-clear-all:hover { background: var(--accent-light); }

        .recent-list { display: flex; flex-direction: column; gap: 2px; }
        .recent-item {
          display: flex; align-items: center;
          border-radius: var(--radius-md);
          transition: background var(--duration-fast) var(--ease-smooth);
          animation: fadeInUp 0.2s var(--ease-smooth) both;
        }
        .recent-item:hover { background: var(--fill); }
        .recent-item-btn {
          flex: 1; display: flex; align-items: center; gap: 12px;
          padding: 10px 12px; border: none; background: none;
          font-size: 14px; color: var(--text); cursor: pointer;
          text-align: left;
        }
        .recent-remove {
          display: flex; align-items: center; justify-content: center;
          width: 28px; height: 28px; border-radius: 50%;
          border: none; background: none; color: var(--text-tertiary);
          cursor: pointer; margin-right: 8px; flex-shrink: 0;
          opacity: 0; transition: all var(--duration-fast) var(--ease-smooth);
        }
        .recent-item:hover .recent-remove { opacity: 1; }
        .recent-remove:hover { background: var(--fill-hover); color: var(--error); }

        .empty-hint {
          display: flex; flex-direction: column; align-items: center;
          gap: 12px; padding: 60px 20px; text-align: center;
          animation: fadeIn 0.4s var(--ease-smooth);
        }
        .hint-icon-circle {
          width: 88px; height: 88px; border-radius: 50%;
          background: var(--fill); display: flex;
          align-items: center; justify-content: center;
          margin-bottom: 8px;
          animation: pulse 3s ease-in-out infinite;
        }
        @keyframes pulse {
          0%, 100% { transform: scale(1); opacity: 1; }
          50% { transform: scale(1.05); opacity: 0.8; }
        }
        .hint-title { font-size: 18px; font-weight: 700; color: var(--text); }
        .hint-subtitle { font-size: 14px; color: var(--text-tertiary); line-height: 1.5; }
        .hint-tip {
          display: flex; align-items: center; gap: 6px;
          margin-top: 8px; font-size: 12px; color: var(--text-tertiary);
        }
        .hint-tip kbd {
          display: inline-flex; align-items: center; justify-content: center;
          min-width: 22px; height: 22px; padding: 0 6px;
          background: var(--fill); border: 1px solid var(--border);
          border-radius: 5px; font-family: inherit; font-size: 11px; font-weight: 600;
        }
        .hint-separator { margin: 0 4px; opacity: 0.4; }

        .placeholder-tab {
          display: flex; flex-direction: column; align-items: center;
          justify-content: center; padding: 80px 20px; text-align: center;
          animation: fadeIn 0.3s var(--ease-smooth);
        }
        .placeholder-icon {
          width: 80px; height: 80px; border-radius: 50%;
          background: var(--fill); display: flex;
          align-items: center; justify-content: center;
          margin-bottom: 20px;
        }
        .placeholder-title { font-size: 18px; font-weight: 700; color: var(--text); margin-bottom: 6px; }
        .placeholder-message { font-size: 14px; color: var(--text-tertiary); max-width: 280px; line-height: 1.5; }

        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(8px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </AppShell>
  );
}
