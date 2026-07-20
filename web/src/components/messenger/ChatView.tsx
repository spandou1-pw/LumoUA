'use client';

import React, { useRef, useEffect, useCallback } from 'react';
import { Avatar, Skeleton } from '../ui';
import { Conversation, Message, useMessages, useSendMessage, useMe } from '../../api/hooks';
import { MessageBubble } from './MessageBubble';
import { TypingIndicator } from './TypingIndicator';
import { Composer } from './Composer';

function DateSeparator({ date }: { date: string }) {
  const d = new Date(date);
  const now = new Date();
  const diffDays = Math.floor((now.getTime() - d.getTime()) / 86400000);
  let label: string;
  if (diffDays === 0) label = 'Сьогодні';
  else if (diffDays === 1) label = 'Вчора';
  else label = d.toLocaleDateString('uk-UA', { day: 'numeric', month: 'long', year: 'numeric' });

  return (
    <div className="date-sep">
      <span className="date-sep-label">{label}</span>
      <style jsx>{`
        .date-sep {
          display: flex; align-items: center; justify-content: center;
          padding: 12px 0 6px;
        }
        .date-sep-label {
          font-size: 12px; font-weight: 600; color: var(--text-secondary);
          background: var(--bg); padding: 4px 12px;
          border-radius: var(--radius-full);
        }
      `}</style>
    </div>
  );
}

function groupMessagesByDate(messages: Message[]): { date: string; items: Message[] }[] {
  const groups: { date: string; items: Message[] }[] = [];
  let current: { date: string; items: Message[] } | null = null;

  for (const msg of messages) {
    const dateKey = new Date(msg.createdAt).toLocaleDateString('uk-UA', { year: 'numeric', month: 'numeric', day: 'numeric' });
    if (!current || current.date !== dateKey) {
      current = { date: dateKey, items: [] };
      groups.push(current);
    }
    current.items.push(msg);
  }
  return groups;
}

export function ChatView({ conversation, onToggleInfo, showInfo }: {
  conversation: Conversation;
  onToggleInfo: () => void;
  showInfo: boolean;
}) {
  const { data, isLoading } = useMessages(conversation.id);
  const sendMessage = useSendMessage();
  const me = useMe();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const myId = me.data?.id;
  const otherName = conversation.participantNames?.[0] || 'Бесіда';

  const shouldAutoScroll = useRef(true);

  useEffect(() => {
    const el = scrollContainerRef.current;
    if (!el) return;
    const handleScroll = () => {
      const { scrollTop, scrollHeight, clientHeight } = el;
      shouldAutoScroll.current = scrollHeight - scrollTop - clientHeight < 120;
    };
    el.addEventListener('scroll', handleScroll, { passive: true });
    return () => el.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    if (shouldAutoScroll.current) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [data]);

  const handleSend = useCallback((text: string) => {
    sendMessage.mutate({ conversationId: conversation.id, body: text });
  }, [conversation.id, sendMessage]);

  const messages = data?.items ?? [];
  const groups = groupMessagesByDate(messages);

  return (
    <div className="cv">
      <div className="cv-header">
        <div className="cv-header-left">
          <Avatar name={otherName} size={36} />
          <div className="cv-header-info">
            <span className="cv-header-name">{otherName}</span>
            <span className="cv-header-status">в мережі</span>
          </div>
        </div>
        <div className="cv-header-actions">
          <button className="cv-action-btn" title="Пошук">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
          </button>
          <button className={`cv-action-btn ${showInfo ? 'active' : ''}`} title="Інформація" onClick={onToggleInfo}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="16" x2="12" y2="12" />
              <line x1="12" y1="8" x2="12.01" y2="8" />
            </svg>
          </button>
          <button className="cv-action-btn" title="Дзвінок">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6 19.79 19.79 0 01-3.07-8.67A2 2 0 014.11 2h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 16.92z" />
            </svg>
          </button>
          <button className="cv-action-btn" title="Більше">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <circle cx="12" cy="5" r="1" />
              <circle cx="12" cy="12" r="1" />
              <circle cx="12" cy="19" r="1" />
            </svg>
          </button>
        </div>
      </div>

      <div className="cv-messages" ref={scrollContainerRef}>
        {isLoading && (
          <div className="cv-loading">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} style={{ display: 'flex', flexDirection: 'column', gap: 4, padding: '0 16px' }}>
                <Skeleton width={`${35 + (i % 3) * 15}%`} height="36px" radius="18px" />
              </div>
            ))}
          </div>
        )}

        {!isLoading && messages.length === 0 && (
          <div className="cv-empty">
            <div className="cv-empty-icon">
              <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="var(--text-tertiary)" strokeWidth="1.2" strokeLinecap="round">
                <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" />
              </svg>
            </div>
            <p className="cv-empty-title">Почніть розмову</p>
            <p className="cv-empty-sub">Напишіть перше повідомлення для {otherName}</p>
          </div>
        )}

        {groups.map((group, gi) => (
          <React.Fragment key={gi}>
            <DateSeparator date={group.date} />
            {group.items.map((msg) => (
              <MessageBubble key={msg.id} message={msg} />
            ))}
          </React.Fragment>
        ))}

        <div ref={messagesEndRef} />
      </div>

      <Composer onSend={handleSend} disabled={sendMessage.isPending} />

      <style jsx>{`
        .cv {
          display: flex; flex-direction: column; height: 100%;
          background: var(--bg); position: relative;
        }
        .cv-header {
          display: flex; align-items: center; justify-content: space-between;
          padding: 10px 16px;
          border-bottom: 1px solid var(--border-light);
          background: var(--bg-primary);
          flex-shrink: 0;
        }
        .cv-header-left { display: flex; align-items: center; gap: 10px; }
        .cv-header-info { display: flex; flex-direction: column; }
        .cv-header-name { font-weight: 700; font-size: 15px; }
        .cv-header-status { font-size: 12px; color: var(--success); font-weight: 500; }
        .cv-header-actions { display: flex; align-items: center; gap: 2px; }
        .cv-action-btn {
          display: flex; align-items: center; justify-content: center;
          width: 34px; height: 34px; border-radius: 50%;
          color: var(--text-secondary);
          transition: all var(--duration-fast) var(--ease-smooth);
        }
        .cv-action-btn:hover { background: var(--fill-hover); color: var(--text); }
        .cv-action-btn.active { background: var(--accent-light); color: var(--accent); }
        .cv-messages {
          flex: 1; overflow-y: auto; padding: 8px 0;
          display: flex; flex-direction: column; gap: 2px;
        }
        .cv-messages::-webkit-scrollbar { width: 4px; }
        .cv-messages::-webkit-scrollbar-thumb { background: var(--border); border-radius: 2px; }
        .cv-loading {
          display: flex; flex-direction: column; gap: 8px;
          padding: 20px 0;
        }
        .cv-empty {
          display: flex; flex-direction: column; align-items: center;
          justify-content: center; flex: 1; gap: 8px;
        }
        .cv-empty-icon {
          width: 80px; height: 80px; border-radius: 50%;
          background: var(--fill); display: flex;
          align-items: center; justify-content: center;
          margin-bottom: 8px;
        }
        .cv-empty-title { font-size: 17px; font-weight: 700; color: var(--text); }
        .cv-empty-sub { font-size: 14px; color: var(--text-secondary); }
      `}</style>
    </div>
  );
}
