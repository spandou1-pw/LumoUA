'use client';

import React from 'react';
import { AppShell } from '../../components/AppShell';
import { useWalletBalance, useCoinPacks, useCreateCheckout } from '../../api/hooks';
import { Button, ErrorState, Skeleton } from '../../components/ui';

export default function WalletPage() {
  const balance = useWalletBalance();
  const coinPacks = useCoinPacks();
  const checkout = useCreateCheckout();

  async function buyCoins(productId: string) {
    const result = await checkout.mutateAsync({ productId, productType: 'coins' });
    window.location.href = result.checkoutUrl; // real Stripe-hosted checkout page
  }

  return (
    <AppShell>
      {balance.isLoading && <Skeleton width={200} height={60} />}

      {balance.isError && (
        <ErrorState
          message={balance.error instanceof Error ? balance.error.message : 'Не вдалося завантажити баланс.'}
          onRetry={() => balance.refetch()}
        />
      )}

      {balance.data && (
        <div className="card">
          <p className="label">Баланс монет</p>
          <p className="value">{Number(balance.data.coinBalance).toLocaleString('uk-UA')}</p>
          {balance.data.locked && <p className="locked">🔒 Гаманець тимчасово заблоковано на перевірку</p>}
        </div>
      )}

      <h2 className="sectionTitle">Купити монети</h2>

      {coinPacks.isLoading && <Skeleton height={120} />}
      {coinPacks.isError && (
        <ErrorState
          message={coinPacks.error instanceof Error ? coinPacks.error.message : 'Не вдалося завантажити пакети монет.'}
          onRetry={() => coinPacks.refetch()}
        />
      )}

      {coinPacks.data && (
        <div className="packs">
          {coinPacks.data.map((pack) => (
            <div key={pack.id} className="pack">
              <span className="packAmount">{Number(pack.coinAmount).toLocaleString('uk-UA')} 🪙</span>
              <Button
                label={`$${(pack.priceUsdCents / 100).toFixed(2)}`}
                onClick={() => buyCoins(pack.id)}
                loading={checkout.isPending}
              />
            </div>
          ))}
        </div>
      )}

      {checkout.isError && (
        <p className="checkoutError">
          {checkout.error instanceof Error ? checkout.error.message : 'Не вдалося створити сесію оплати.'}
        </p>
      )}

      <style jsx>{`
        .card { background: var(--color-chornozem); border-radius: 16px; padding: 32px; text-align: center; max-width: 320px; margin-bottom: 32px; }
        .label { color: var(--color-text-secondary); font-size: 13px; margin: 0 0 6px; }
        .value { color: var(--color-wheat); font-size: 36px; font-weight: 800; margin: 0; }
        .locked { color: var(--color-error); font-size: 12px; margin-top: 10px; }
        .sectionTitle { font-size: 16px; font-weight: 700; margin: 0 0 12px; }
        .packs { display: flex; flex-direction: column; gap: 10px; max-width: 320px; }
        .pack { display: flex; align-items: center; justify-content: space-between; background: var(--surface-elevated); border-radius: 12px; padding: 14px 16px; }
        .packAmount { font-size: 15px; font-weight: 700; }
        .checkoutError { color: var(--color-error); font-size: 13px; margin-top: 12px; }
      `}</style>
    </AppShell>
  );
}
