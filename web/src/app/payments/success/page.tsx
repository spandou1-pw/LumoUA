'use client';

import React from 'react';
import Link from 'next/link';
import { Button } from '../../../components/ui';

/**
 * doc PAYMENTS.md: this is a display-only landing page. The actual
 * fulfillment (crediting coins / activating the subscription) happens
 * server-side via the Stripe webhook (`checkout.session.completed`),
 * which is authoritative — this page never grants anything itself, it
 * just confirms to the user that checkout completed and points them back
 * into the app to see the result reflected in their real balance.
 */
export default function PaymentSuccessPage() {
  return (
    <main className="wrap">
      <div className="icon">✓</div>
      <h1 className="title">Оплату завершено</h1>
      <p className="body">Ваш баланс оновиться протягом кількох секунд.</p>
      <Link href="/wallet">
        <Button label="До гаманця" onClick={() => {}} />
      </Link>
      <style jsx>{`
        .wrap { min-height: 100vh; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 16px; background: var(--color-stone); text-align: center; padding: 24px; }
        .icon { width: 64px; height: 64px; border-radius: 32px; background: var(--color-success); color: white; font-size: 32px; display: flex; align-items: center; justify-content: center; }
        .title { font-size: 22px; font-weight: 800; color: var(--color-chornozem); margin: 0; }
        .body { font-size: 14px; color: var(--text-secondary); margin: 0 0 8px; }
      `}</style>
    </main>
  );
}
