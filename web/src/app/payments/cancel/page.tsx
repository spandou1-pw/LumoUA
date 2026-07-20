'use client';

import React from 'react';
import Link from 'next/link';
import { Button } from '../../../components/ui';

export default function PaymentCancelPage() {
  return (
    <main className="wrap">
      <h1 className="title">Оплату скасовано</h1>
      <p className="body">З вашого рахунку нічого не списано.</p>
      <Link href="/wallet">
        <Button label="Повернутися" variant="secondary" onClick={() => {}} />
      </Link>
      <style jsx>{`
        .wrap { min-height: 100vh; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 16px; background: var(--color-stone); text-align: center; padding: 24px; }
        .title { font-size: 22px; font-weight: 800; color: var(--color-chornozem); margin: 0; }
        .body { font-size: 14px; color: var(--text-secondary); margin: 0 0 8px; }
      `}</style>
    </main>
  );
}
