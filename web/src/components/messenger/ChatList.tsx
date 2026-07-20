'use client';

import React, { useState, useMemo, useCallback, useRef, useEffect } from 'react';
import { Avatar, Badge } from '../ui';
import { Conversation } from '../../api/hooks';

const FILTERS = [
  { key: 'all', label: 'Усі' },
  { key: 'unread', label: 'Непрочитані' },
  { key: 'private', label: 'Приватні' },
  { key: 'groups', label: 'Групи' },
];

function formatTime(dateStr: string | null): string {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffDays = Math.floor(diffMs / 86400000);
  if (diffDays === 0) return d.toLocaleTimeString('uk-UA', { hour: '2-digit', minute: '2-digit' });
  if (diffDays === 1) return 'Вчора';
  if (diffDays < 7) return d.toLocaleDateString('uk-UA', { weekday: 'short' });
  return d.toLocaleDateString('uk-UA', { day: 'numeric', month: 'short' });
}

function ChatListItem({ conv, isActive, onClick, onContextMenu }: {
  conv: Conversation;
  isActive: boolean;
  onClick: () => void;
  onContextMenu: (e: React.MouseEvent) => void;
}) {
  const name = conv.participantNames?.[0] || 'Бесіда';
  const hasUnread = conv.unreadCount > 0;
  const preview = conv.lastMessagePreview || 'Почати розмову';
  const time = formatTime(conv.lastMessageAt);

  return (
    <div
      className={`cli ${isActive ? 'active' : ''}`}
      onClick={onClick}
      onContextMenu={onContextMenu}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onClick(); } }}
    >
      <div className="cli-avatar">
        <Avatar name={name} size={48} />
        <span className="cli-online" />
      </div>
      <div className="cli-body">
        <div className="cli-top">
          <span className="cli-name">{name}</span>
          <span className={`cli-time ${hasUnread ? 'unread' : ''}`}>{time}</span>
        </div>
        <div className="cli-bottom">
          <span className={`cli-preview ${hasUnread ? 'unread' : ''}`}>{preview}</span>
          {hasUnread && (
            <span className="cli-badge">
              {conv.unreadCount > 99 ? '99+' : conv.unreadCount}
            </span>
          )}
        </div>
      </div>
      <style jsx>{`
        .cli {
          display: flex; align-items: center; gap: 10px;
          padding: 8px 10px; border-radius: var(--radius);
          cursor: pointer; user-select: none;
          transition: background var(--duration-fast) var(--ease-smooth);
          position: relative;
        }
        .cli:hover { background: var(--fill-hover); }
        .cli.active { background: var(--accent-light); }
        .cli:active { transform: scale(0.99); }
        .cli-avatar { position: relative; flex-shrink: 0; }
        .cli-online {
          position: absolute; bottom: 1px; right: 1px;
          width: 11px; height: 11px; border-radius: 50%;
          background: var(--success);
          border: 2.5px solid var(--bg-primary);
        }
        .cli-body { flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 3px; }
        .cli-top { display: flex; justify-content: space-between; align-items: baseline; gap: 8px; }
        .cli-name {
          font-size: 15px; font-weight: 600; color: var(--text);
          overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
          flex: 1;
        }
        .cli-time {
          font-size: 12px; color: var(--text-tertiary); flex-shrink: 0;
          font-weight: 400;
        }
        .cli-time.unread { color: var(--accent); font-weight: 600; }
        .cli-bottom { display: flex; align-items: center; gap: 8px; }
        .cli-preview {
          font-size: 13.5px; color: var(--text-secondary);
          overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
          flex: 1; line-height: 1.3;
        }
        .cli-preview.unread { color: var(--text); font-weight: 500; }
        .cli-badge {
          background: var(--accent); color: white;
          font-size: 11px; font-weight: 700;
          min-width: 20px; height: 20px; border-radius: 10px;
          display: flex; align-items: center; justify-content: center;
          padding: 0 6px; flex-shrink: 0;
          animation: badgePop 0.2s var(--ease-spring);
        }
        @keyframes badgePop {
          from { transform: scale(0.5); } to { transform: scale(1); }
        }
      `}</style>
    </div>
  );
}

export function ChatList({ conversations, activeId, onSelect, onContextMenu }: {
  conversations: Conversation[];
  activeId: string | null;
  onSelect: (conv: Conversation) => void;
  onContextMenu: (e: React.MouseEvent, conv: Conversation) => void;
}) {
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');
  const searchRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        searchRef.current?.focus();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  const filtered = useMemo(() => {
    let list = conversations;
    if (filter === 'unread') list = list.filter((c) => c.unreadCount > 0);
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter((c) =>
        c.participantNames?.some((n) => n.toLowerCase().includes(q)) ||
        c.lastMessagePreview?.toLowerCase().includes(q)
      );
    }
    return list.sort((a, b) => {
      const ta = a.lastMessageAt ? new Date(a.lastMessageAt).getTime() : 0;
      const tb = b.lastMessageAt ? new Date(b.lastMessageAt).getTime() : 0;
      return tb - ta;
    });
  }, [conversations, filter, search]);

  const totalUnread = useMemo(() =>
    conversations.reduce((s, c) => s + c.unreadCount, 0),
    [conversations]
  );

  return (
    <div className="cl">
      <div className="cl-header">
        <h2 className="cl-title">Чати</h2>
        <div className="cl-header-actions">
          {totalUnread > 0 && (
            <span className="cl-unread-total">{totalUnread}</span>
          )}
        </div>
      </div>

      <div className="cl-search-wrap">
        <svg className="cl-search-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--text-tertiary)" strokeWidth="2" strokeLinecap="round">
          <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
        </svg>
        <input
          ref={searchRef}
          className="cl-search"
          placeholder="Пошук чатів..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        {search && (
          <button className="cl-search-clear" onClick={() => setSearch('')}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--text-tertiary)" strokeWidth="2" strokeLinecap="round">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        )}
        <span className="cl-search-hint">⌘K</span>
      </div>

      <div className="cl-filters">
        {FILTERS.map((f) => (
          <button
            key={f.key}
            className={`cl-filter ${filter === f.key ? 'active' : ''}`}
            onClick={() => setFilter(f.key)}
          >
            {f.label}
            {f.key === 'unread' && totalUnread > 0 && (
              <span className="cl-filter-count">{totalUnread}</span>
            )}
          </button>
        ))}
      </div>

      <div className="cl-list" ref={listRef}>
        {filtered.length === 0 && (
          <div className="cl-empty">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="var(--text-tertiary)" strokeWidth="1.5" strokeLinecap="round">
              <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/>
            </svg>
            <span>{search ? 'Нічого не знайдено' : 'Поки що порожньо'}</span>
          </div>
        )}
        {filtered.map((conv) => (
          <ChatListItem
            key={conv.id}
            conv={conv}
            isActive={conv.id === activeId}
            onClick={() => onSelect(conv)}
            onContextMenu={(e) => onContextMenu(e, conv)}
          />
        ))}
      </div>

      <style jsx>{`
        .cl {
          display: flex; flex-direction: column;
          height: 100%; background: var(--bg-primary);
          border-right: 1px solid var(--border-light);
        }
        .cl-header {
          display: flex; align-items: center; justify-content: space-between;
          padding: 16px 16px 8px;
        }
        .cl-title { font-size: 22px; font-weight: 800; letter-spacing: -0.03em; }
        .cl-header-actions { display: flex; align-items: center; gap: 8px; }
        .cl-unread-total {
          background: var(--accent-light); color: var(--accent);
          font-size: 12px; font-weight: 700; padding: 2px 8px;
          border-radius: var(--radius-full);
        }
        .cl-search-wrap {
          display: flex; align-items: center; gap: 8px;
          margin: 4px 12px 0; padding: 0 10px;
          height: 36px; border-radius: var(--radius);
          background: var(--fill); position: relative;
          transition: all var(--duration-fast) var(--ease-smooth);
        }
        .cl-search-wrap:focus-within {
          background: var(--bg); box-shadow: 0 0 0 2px var(--accent-light);
        }
        .cl-search-icon { flex-shrink: 0; opacity: 0.5; }
        .cl-search {
          flex: 1; border: none; background: none;
          font-size: 14px; color: var(--text); outline: none; height: 100%;
        }
        .cl-search::placeholder { color: var(--text-tertiary); }
        .cl-search-clear {
          display: flex; align-items: center; justify-content: center;
          width: 20px; height: 20px; border-radius: 50%;
          transition: background var(--duration-fast);
        }
        .cl-search-clear:hover { background: var(--fill-hover); }
        .cl-search-hint {
          font-size: 11px; color: var(--text-tertiary);
          background: var(--fill-hover); padding: 1px 5px;
          border-radius: 4px; font-weight: 500;
          font-family: var(--font-mono); flex-shrink: 0;
        }
        .cl-filters {
          display: flex; gap: 4px; padding: 10px 12px 4px;
          overflow-x: auto;
        }
        .cl-filters::-webkit-scrollbar { display: none; }
        .cl-filter {
          display: flex; align-items: center; gap: 5px;
          padding: 5px 12px; border-radius: var(--radius-full);
          font-size: 13px; font-weight: 500; white-space: nowrap;
          color: var(--text-secondary); background: none; border: none;
          cursor: pointer; transition: all var(--duration-fast) var(--ease-smooth);
        }
        .cl-filter:hover { background: var(--fill-hover); color: var(--text); }
        .cl-filter.active { background: var(--accent); color: white; font-weight: 600; }
        .cl-filter-count {
          font-size: 10px; font-weight: 700;
          background: rgba(255,255,255,0.25); padding: 0 5px;
          border-radius: 8px; min-width: 16px; height: 16px;
          display: flex; align-items: center; justify-content: center;
        }
        .cl-filter:not(.active) .cl-filter-count {
          background: var(--fill); color: var(--accent);
        }
        .cl-list {
          flex: 1; overflow-y: auto; padding: 6px 6px;
          display: flex; flex-direction: column; gap: 1px;
        }
        .cl-list::-webkit-scrollbar { width: 4px; }
        .cl-list::-webkit-scrollbar-thumb { background: var(--border); border-radius: 2px; }
        .cl-empty {
          display: flex; flex-direction: column; align-items: center;
          gap: 8px; padding: 40px 16px;
          color: var(--text-tertiary); font-size: 13px;
        }
      `}</style>
    </div>
  );
}
