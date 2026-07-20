'use client';

import React from 'react';
import { AppShell } from '../../components/AppShell';
import { useConversations } from '../../api/hooks';
import { ErrorState, EmptyState, Skeleton } from '../../components/ui';

/**
 * doc LAUNCH_READINESS.md: metadata only, same honest boundary as the
 * mobile ConversationsScreen — no message content, since this client has
 * no Signal Protocol implementation yet and the server never has
 * plaintext to serve even if it wanted to.
 */
export default function MessagesPage() {
  const { data, isLoading, isError, error, refetch } = useConversations();
  const items = data?.items ?? [];

  return (
    <AppShell>
      {isLoading && <Skeleton height={200} />}
      {isError && (
        <ErrorState message={error instanceof Error ? error.message : 'Не вдалося завантажити розмови.'} onRetry={() => refetch()} />
      )}
      {!isLoading && !isError && items.length === 0 && (
        <EmptyState title="Немає розмов" message="Почніть розмову з профілю користувача." />
      )}
      {items.map((item) => (
        <div key={item.id} className="row">
          <div className="avatar">??</div>
          <div style={{ flex: 1 }}>
            <p className="title">{item.participantIds.length} учасник(и)</p>
            <p className="preview">
              {item.lastMessageAt ? `Востаннє: ${new Date(item.lastMessageAt).toLocaleString('uk-UA')}` : 'Немає повідомлень'}
            </p>
          </div>
          {item.unreadCount > 0 && <span className="badge">{item.unreadCount}</span>}
        </div>
      ))}

      <style jsx>{`
        .row { display: flex; align-items: center; gap: 12px; padding: 16px; border-bottom: 1px solid var(--color-border); background: var(--surface-elevated); border-radius: 12px; margin-bottom: 8px; }
        .avatar { width: 40px; height: 40px; border-radius: 20px; background: var(--color-chicory); color: white; display: flex; align-items: center; justify-content: center; font-size: 12px; font-weight: 700; }
        .title { font-size: 14px; font-weight: 700; margin: 0; }
        .preview { font-size: 12.5px; color: var(--text-secondary); margin: 2px 0 0; }
        .badge { background: var(--color-error); color: white; border-radius: 999px; min-width: 20px; height: 20px; display: flex; align-items: center; justify-content: center; font-size: 11px; font-weight: 700; padding: 0 5px; }
      `}</style>
    </AppShell>
  );
}
