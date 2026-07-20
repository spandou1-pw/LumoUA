'use client';

import React from 'react';
import { AppShell } from '../../components/AppShell';
import { useNotifications } from '../../api/hooks';
import { ErrorState, EmptyState, Skeleton } from '../../components/ui';

export default function NotificationsPage() {
  const { data, isLoading, isError, error, refetch } = useNotifications();
  const items = data?.items ?? [];

  return (
    <AppShell>
      {isLoading && <Skeleton height={200} />}
      {isError && (
        <ErrorState message={error instanceof Error ? error.message : 'Не вдалося завантажити сповіщення.'} onRetry={() => refetch()} />
      )}
      {!isLoading && !isError && items.length === 0 && (
        <EmptyState title="Тут порожньо" message="Сповіщення про лайки, коментарі та подарунки з'являться тут." />
      )}
      {items.map((item) => (
        <div key={item.id} className={item.readAt ? 'row' : 'row rowUnread'}>
          <p className="title">{item.title}</p>
          <p className="body">{item.body}</p>
          <p className="time">{new Date(item.createdAt).toLocaleString('uk-UA')}</p>
        </div>
      ))}

      <style jsx>{`
        .row { padding: 16px; border-bottom: 1px solid var(--color-border); background: var(--surface-elevated); border-radius: 12px; margin-bottom: 8px; }
        .rowUnread { background: var(--color-wheat-soft); }
        .title { font-size: 14px; font-weight: 700; margin: 0; }
        .body { font-size: 13px; color: var(--text-secondary); margin: 2px 0 0; }
        .time { font-size: 11px; color: var(--text-secondary); margin: 6px 0 0; }
      `}</style>
    </AppShell>
  );
}
