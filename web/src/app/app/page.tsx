'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { api, hasStoredRefreshToken } from '../../api/client';

/**
 * doc LUMO.md: this is what the Tauri desktop shell actually opens
 * (tauri.conf.json's window `url` points here, not at `/`) — the real app
 * entry point, doing the real session check before routing into the
 * logged-in experience. `/` is reserved for the public marketing page a
 * plain browser visitor sees; the desktop app never shows that page at
 * all, matching "весь функціонал — в застосунку."
 */
export default function AppEntryPage() {
  const router = useRouter();
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    checkSession();
  }, []);

  async function checkSession() {
    if (!hasStoredRefreshToken()) {
      router.replace('/login');
      return;
    }
    try {
      await api.get('/users/me');
      router.replace('/feed');
    } catch {
      router.replace('/login');
    } finally {
      setChecking(false);
    }
  }

  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', background: 'var(--color-night)' }}>
      {checking && (
        <div style={{ color: 'var(--color-wheat)', fontWeight: 800, fontSize: 24 }} aria-live="polite">
          Lumo
        </div>
      )}
    </div>
  );
}
