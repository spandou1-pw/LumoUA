'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useInAppShortcut, isDesktop } from '../native/bridge';
import { Button } from './ui';

const NAV_ITEMS = [
  { href: '/feed', label: 'Стрічка', icon: '🏠' },
  { href: '/messages', label: 'Повідомлення', icon: '💬' },
  { href: '/notifications', label: 'Сповіщення', icon: '🔔' },
  { href: '/gifts', label: 'Подарунки', icon: '🎁' },
  { href: '/premium', label: 'Premium', icon: '✦' },
  { href: '/wallet', label: 'Гаманець', icon: '💰' },
  { href: '/profile', label: 'Профіль', icon: '👤' },
  { href: '/settings', label: 'Налаштування', icon: '⚙️' },
];

/**
 * doc LUMO.md: explicit product decision — the public website shows only
 * the marketing landing page; every functional screen requires the
 * desktop app. This check lives in exactly one place (`AppShell`, which
 * every functional page already wraps) rather than being duplicated
 * per-page — the same "one code path per concern" discipline used
 * everywhere else in this codebase. A browser visitor who navigates
 * directly to e.g. /feed sees a clear explanation and a way back to the
 * download page, never a broken half-loaded screen.
 */
function DesktopOnlyGate({ children }: { children: React.ReactNode }) {
  const [checked, setChecked] = useState(false);
  const [allowed, setAllowed] = useState(false);

  useEffect(() => {
    setAllowed(isDesktop());
    setChecked(true);
  }, []);

  if (!checked) return null;

  if (!allowed) {
    return (
      <div className="gate">
        <p className="gateTitle">Цей розділ доступний лише в застосунку Lumo</p>
        <p className="gateBody">Завантажте застосунок для Windows або macOS, щоб отримати повний доступ.</p>
        <Link href="/">
          <Button label="До сторінки завантаження" onClick={() => {}} />
        </Link>
        <style jsx>{`
          .gate { min-height: 100vh; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 12px; background: var(--background); text-align: center; padding: 24px; }
          .gateTitle { font-size: 18px; font-weight: 700; color: var(--text); margin: 0; }
          .gateBody { font-size: 14px; color: var(--text-secondary); margin: 0 0 8px; max-width: 320px; }
        `}</style>
      </div>
    );
  }

  return <>{children}</>;
}

/**
 * doc 19: persistent left sidebar (not a hamburger menu) — desktop/web has
 * the screen real estate mobile doesn't, and a collapsible-on-narrow-
 * viewport sidebar (via CSS, not JS breakpoint logic) keeps this one
 * component correct at every window size rather than two parallel
 * implementations.
 */
function AppShellInner({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  // doc: Keyboard Shortcuts — Cmd/Ctrl+K focuses search (a standard,
  // widely-recognized shortcut users already expect from similar apps).
  useInAppShortcut({ key: 'k', meta: true }, () => {
    document.getElementById('global-search')?.focus();
  });

  return (
    <div className="shell">
      <nav className="sidebar" aria-label="Основна навігація">
        <div className="wordmark">Lumo</div>
        <input id="global-search" className="search" placeholder="Пошук (⌘K)" aria-label="Пошук" />
        <ul>
          {NAV_ITEMS.map((item) => (
            <li key={item.href}>
              <Link href={item.href} className={pathname === item.href ? 'active' : ''} aria-current={pathname === item.href ? 'page' : undefined}>
                <span aria-hidden="true">{item.icon}</span> {item.label}
              </Link>
            </li>
          ))}
        </ul>
      </nav>
      <main id="main-content" className="content" tabIndex={-1}>
        {children}
      </main>

      <style jsx>{`
        .shell {
          display: flex;
          min-height: 100vh;
        }
        .sidebar {
          width: 220px;
          flex-shrink: 0;
          background: var(--surface);
          border-right: 1px solid var(--color-border);
          padding: var(--space-xl) 0;
          position: sticky;
          top: 0;
          height: 100vh;
        }
        .wordmark {
          font-weight: 800;
          font-size: 20px;
          padding: 0 var(--space-xl) var(--space-lg);
          color: var(--color-chornozem);
        }
        .search {
          margin: 0 var(--space-lg) var(--space-lg);
          width: calc(100% - var(--space-lg) * 2);
          padding: 8px 12px;
          border-radius: var(--radius-small);
          border: 1px solid var(--color-border);
          font-size: 13px;
        }
        ul {
          list-style: none;
          margin: 0;
          padding: 0;
        }
        li a {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 10px var(--space-xl);
          color: var(--text-secondary);
          text-decoration: none;
          font-size: 14px;
          font-weight: 600;
        }
        li a.active {
          color: var(--color-chornozem);
          background: var(--color-wheat-soft);
        }
        .content {
          flex: 1;
          padding: var(--space-xl);
          max-width: 720px;
        }
        /* doc 19: responsive — sidebar collapses to icons-only below tablet width,
           matching the Stage 2 tablet-rail concept without a separate mobile nav component */
        @media (max-width: 900px) {
          .sidebar {
            width: 64px;
          }
          .wordmark,
          .search,
          li a span + * {
            display: none;
          }
          li a {
            justify-content: center;
            padding: 12px;
          }
        }
      `}</style>
    </div>
  );
}

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <DesktopOnlyGate>
      <AppShellInner>{children}</AppShellInner>
    </DesktopOnlyGate>
  );
}
