'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { AppShell } from '../../components/AppShell';
import { useLogout } from '../../api/hooks';
import { Button } from '../../components/ui';
import { isDesktop, checkForUpdates, requestNotificationPermission } from '../../native/bridge';

export default function SettingsPage() {
  const router = useRouter();
  const logout = useLogout();
  const [desktop, setDesktop] = useState(false);
  const [updateStatus, setUpdateStatus] = useState<string | null>(null);

  useEffect(() => setDesktop(isDesktop()), []);

  async function handleLogout() {
    await logout.mutateAsync();
    router.replace('/login');
  }

  async function handleCheckUpdates() {
    setUpdateStatus('Перевіряємо...');
    const result = await checkForUpdates();
    setUpdateStatus(result.available ? `Доступне оновлення: ${result.version}` : "У вас найновіша версія.");
  }

  return (
    <AppShell>
      <h2 className="section">Акаунт</h2>
      <div className="row">Обліковий запис</div>
      <div className="row">Приватність</div>

      <h2 className="section">Сповіщення</h2>
      <button className="row" onClick={() => requestNotificationPermission()}>
        Увімкнути сповіщення {desktop ? '(системні)' : '(браузер)'}
      </button>

      {/* doc: desktop-only section — Automatic Updates has no web equivalent
          (a browser tab always serves the latest deploy) — shown only when
          actually running inside Tauri, not hidden-but-present. */}
      {desktop && (
        <>
          <h2 className="section">Оновлення застосунку</h2>
          <button className="row" onClick={handleCheckUpdates}>
            Перевірити оновлення
          </button>
          {updateStatus && <p className="status">{updateStatus}</p>}
        </>
      )}

      <Button label={logout.isPending ? 'Виходимо...' : 'Вийти'} variant="secondary" onClick={handleLogout} />

      <style jsx>{`
        .section { font-size: 12px; font-weight: 700; text-transform: uppercase; color: var(--text-secondary); margin: 24px 0 8px; }
        .row { display: block; width: 100%; text-align: left; padding: 12px 16px; background: var(--surface-elevated); border: none; border-bottom: 1px solid var(--color-border); font-size: 14.5px; cursor: pointer; color: var(--text); }
        .status { font-size: 13px; color: var(--text-secondary); margin: 8px 0 0; }
      `}</style>
    </AppShell>
  );
}
