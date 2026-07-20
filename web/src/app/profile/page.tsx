'use client';

import React from 'react';
import { AppShell } from '../../components/AppShell';
import { useMe } from '../../api/hooks';
import { ErrorState, Skeleton } from '../../components/ui';

export default function ProfilePage() {
  const me = useMe();

  return (
    <AppShell>
      {me.isLoading && (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12, paddingTop: 40 }}>
          <Skeleton width={96} height={96} />
          <Skeleton width={140} height={18} />
        </div>
      )}

      {me.isError && (
        <ErrorState message={me.error instanceof Error ? me.error.message : 'Не вдалося завантажити профіль.'} onRetry={() => me.refetch()} />
      )}

      {me.data && (
        <div className="header">
          <div className="avatar">{me.data.displayName.slice(0, 2).toUpperCase()}</div>
          <h1 className="name">{me.data.displayName}</h1>
          <p className="username">@{me.data.username}</p>
          {me.data.bio && <p className="bio">{me.data.bio}</p>}
        </div>
      )}

      <style jsx>{`
        .header { display: flex; flex-direction: column; align-items: center; padding: 32px 0; text-align: center; }
        .avatar { width: 96px; height: 96px; border-radius: 48px; background: var(--color-chicory); color: white; display: flex; align-items: center; justify-content: center; font-size: 30px; font-weight: 700; margin-bottom: 12px; }
        .name { font-size: 19px; font-weight: 800; color: var(--color-chornozem); margin: 0; }
        .username { font-size: 12.5px; color: var(--text-secondary); margin: 4px 0 0; }
        .bio { font-size: 14px; margin-top: 12px; max-width: 400px; }
      `}</style>
    </AppShell>
  );
}
