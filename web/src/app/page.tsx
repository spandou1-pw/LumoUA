'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { Button } from '../components/ui';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3000';
// doc LUMO.md: real GitHub Releases URL, set to your actual repo once
// pushed — the CI workflow (.github/workflows/build-desktop.yml) uploads
// the compiled installers there automatically on every tag. This is
// intentionally NOT a static file path on this site's own hosting, since
// no installer file exists here until that workflow has actually run.
const RELEASES_URL = process.env.NEXT_PUBLIC_RELEASES_URL ?? 'https://github.com/YOUR_USERNAME/lumo/releases/latest';

/**
 * doc LUMO.md: per explicit instruction — the public website shows ONLY
 * this page (register or download the app). Every functional screen
 * (feed, wallet, gifts, premium, messages...) lives behind the desktop
 * app, gated by `AppShell`'s `isDesktop()` check. This page itself has no
 * app-shell, no sidebar, no authenticated content — it's the one thing a
 * browser visitor who hasn't installed anything can see.
 *
 * The user count below is REAL, pulled from `/public-stats/user-count` —
 * never a fabricated number, even for marketing. See PublicStatsController.
 */
export default function LandingPage() {
  const [userCount, setUserCount] = useState<number | null>(null);

  useEffect(() => {
    fetch(`${API_BASE_URL}/public-stats/user-count`)
      .then((r) => r.json())
      .then((data) => setUserCount(data.userCount))
      .catch(() => setUserCount(null));
  }, []);

  return (
    <main className="wrap">
      <header className="hero">
        <h1 className="wordmark">Lumo</h1>
        <p className="tagline">Одна стрічка. Один месенджер. Одне коло.</p>

        {userCount !== null && (
          <p className="stat">
            <strong>{userCount.toLocaleString('uk-UA')}</strong> людей вже приєдналися
          </p>
        )}

        <div className="actions">
          <Link href="/register">
            <Button label="Зареєструватися" onClick={() => {}} />
          </Link>
        </div>
      </header>

      <section className="downloads">
        <h2 className="downloadsTitle">Завантажити застосунок</h2>
        <p className="downloadsBody">Повний функціонал Lumo — у нативному застосунку для вашої платформи.</p>
        <div className="downloadButtons">
          <a href={RELEASES_URL} className="downloadButton">
            🪟 Windows
          </a>
          <a href={RELEASES_URL} className="downloadButton">
            🍎 macOS
          </a>
        </div>
        <p className="downloadsNote">
          Уже маєте акаунт? Увійдіть безпосередньо в застосунку після встановлення.
        </p>
      </section>

      <style jsx>{`
        .wrap { min-height: 100vh; background: var(--color-night); color: var(--color-text-primary-dark, #f2f0e8); display: flex; flex-direction: column; align-items: center; padding: 80px 24px; }
        .hero { text-align: center; max-width: 480px; margin-bottom: 80px; }
        .wordmark { font-size: 40px; font-weight: 800; color: var(--color-wheat); margin: 0 0 8px; }
        .tagline { font-size: 16px; color: #a7a290; margin: 0 0 24px; }
        .stat { font-size: 14px; color: #a7a290; margin: 0 0 32px; }
        .stat strong { color: var(--color-wheat); font-size: 18px; }
        .actions { display: flex; justify-content: center; }
        .downloads { text-align: center; max-width: 480px; }
        .downloadsTitle { font-size: 20px; font-weight: 700; color: #f2f0e8; margin: 0 0 8px; }
        .downloadsBody { font-size: 14px; color: #a7a290; margin: 0 0 24px; }
        .downloadButtons { display: flex; gap: 12px; justify-content: center; margin-bottom: 20px; }
        .downloadButton { display: inline-flex; align-items: center; gap: 8px; padding: 12px 24px; border-radius: 10px; background: var(--color-night-1, #181d33); color: #f2f0e8; text-decoration: none; font-weight: 600; font-size: 14px; border: 1px solid #2b3050; }
        .downloadsNote { font-size: 12px; color: #6b655a; }
      `}</style>
    </main>
  );
}
