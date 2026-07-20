'use client';

import React, { useState } from 'react';
import { AppShell } from '../../components/AppShell';
import { usePremiumStatus, useCosmeticCatalog, useSelectCosmetic, usePremiumPlans, useCreateCheckout } from '../../api/hooks';
import { Button, ErrorState, EmptyState, Skeleton } from '../../components/ui';

const CATEGORIES = ['badge', 'frame', 'theme', 'banner', 'username_color'];

export default function PremiumPage() {
  const status = usePremiumStatus();
  const [category, setCategory] = useState('badge');
  const catalog = useCosmeticCatalog(category);
  const select = useSelectCosmetic();
  const plans = usePremiumPlans();
  const checkout = useCreateCheckout();

  async function subscribe(planId: string) {
    const result = await checkout.mutateAsync({ productId: planId, productType: 'premium' });
    window.location.href = result.checkoutUrl;
  }

  return (
    <AppShell>
      {status.isLoading && <Skeleton height={100} />}
      {status.isError && (
        <ErrorState message={status.error instanceof Error ? status.error.message : 'Не вдалося завантажити статус.'} onRetry={() => status.refetch()} />
      )}
      {status.data && (
        <div className={status.data.isPremium ? 'status statusActive' : 'status'}>
          <p className="statusTitle">{status.data.isPremium ? '✦ Ви Premium' : 'Спробуйте Premium'}</p>
          <p className="statusBody">
            {status.data.isPremium
              ? status.data.renewsAt
                ? `Поновлення ${new Date(status.data.renewsAt).toLocaleDateString('uk-UA')}`
                : 'Активна підписка'
              : 'Анімовані бейджі, рамки, банери та більше лімітів.'}
          </p>
        </div>
      )}

      {!status.data?.isPremium && plans.data && plans.data.length > 0 && (
        <div className="plans">
          {plans.data.map((plan) => (
            <div key={plan.id} className="plan">
              <span>{plan.name} — ${(plan.priceUsdCents / 100).toFixed(2)}/{plan.interval}</span>
              <Button label="Оформити" onClick={() => subscribe(plan.id)} loading={checkout.isPending} />
            </div>
          ))}
        </div>
      )}
      {checkout.isError && (
        <p className="checkoutError">{checkout.error instanceof Error ? checkout.error.message : 'Не вдалося створити сесію оплати.'}</p>
      )}

      <div className="tabs">
        {CATEGORIES.map((c) => (
          <button key={c} className={c === category ? 'tab tabActive' : 'tab'} onClick={() => setCategory(c)}>
            {c}
          </button>
        ))}
      </div>

      {catalog.isLoading && <Skeleton height={200} />}
      {catalog.isError && (
        <ErrorState message={catalog.error instanceof Error ? catalog.error.message : 'Не вдалося завантажити каталог.'} onRetry={() => catalog.refetch()} />
      )}
      {catalog.data && catalog.data.length === 0 && <EmptyState title="Порожньо" message="У цій категорії поки немає елементів." />}

      {catalog.data && catalog.data.length > 0 && (
        <div className="grid">
          {catalog.data.map((item) => {
            const locked = item.requiresPremium && !status.data?.isPremium;
            return (
              <div key={item.id} className="card">
                <div className={locked ? 'preview previewLocked' : 'preview'}>{item.isAnimated && '✨'}</div>
                <p className="cardName">{item.name}</p>
                <Button label={locked ? 'Premium' : 'Обрати'} variant={locked ? 'secondary' : 'primary'} disabled={locked} onClick={() => select.mutate(item.id)} />
              </div>
            );
          })}
        </div>
      )}

      <style jsx>{`
        .status { background: var(--color-wheat-soft); border-radius: 16px; padding: 20px; margin-bottom: 20px; }
        .statusActive { background: var(--color-chornozem); }
        .statusTitle { font-weight: 800; font-size: 17px; color: var(--color-chornozem); margin: 0 0 4px; }
        .statusActive .statusTitle { color: var(--color-wheat); }
        .statusBody { font-size: 13px; color: var(--text-secondary); margin: 0; }
        .tabs { display: flex; gap: 8px; flex-wrap: wrap; margin-bottom: 16px; }
        .tab { font-size: 12px; font-weight: 600; color: var(--text-secondary); padding: 6px 12px; border-radius: 999px; background: var(--surface-elevated); border: none; cursor: pointer; }
        .tabActive { background: var(--color-wheat); color: var(--color-chornozem); }
        .grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(140px, 1fr)); gap: 12px; }
        .card { background: var(--surface-elevated); border-radius: 12px; padding: 12px; display: flex; flex-direction: column; align-items: center; gap: 8px; }
        .preview { width: 100%; height: 70px; border-radius: 8px; background: var(--color-chicory-soft); display: flex; align-items: center; justify-content: center; }
        .previewLocked { opacity: 0.5; }
        .cardName { font-size: 12px; font-weight: 600; margin: 0; }
        .plans { display: flex; flex-direction: column; gap: 10px; max-width: 400px; margin-bottom: 24px; }
        .plan { display: flex; align-items: center; justify-content: space-between; background: var(--surface-elevated); border-radius: 12px; padding: 14px 16px; font-size: 14px; }
        .checkoutError { color: var(--color-error); font-size: 13px; margin-bottom: 16px; }
      `}</style>
    </AppShell>
  );
}
