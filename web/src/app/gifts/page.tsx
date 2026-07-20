'use client';

import React, { useState } from 'react';
import { AppShell } from '../../components/AppShell';
import { useGiftStore, useSendGift, useUserLookup, PublicUser } from '../../api/hooks';
import { Button, ErrorState, EmptyState, Skeleton } from '../../components/ui';
import { ApiError } from '../../api/client';

const RARITY_LABELS: Record<string, string> = { common: 'Звичайні', rare: 'Рідкісні', legendary: 'Легендарні' };

export default function GiftStorePage() {
  const [rarity, setRarity] = useState<string | undefined>(undefined);
  const store = useGiftStore(rarity);
  const sendGift = useSendGift();

  const [usernameInput, setUsernameInput] = useState('');
  const [recipient, setRecipient] = useState<PublicUser | null>(null);
  const lookup = useUserLookup();

  const [sentGiftId, setSentGiftId] = useState<string | null>(null);

  async function findRecipient(e: React.FormEvent) {
    e.preventDefault();
    setRecipient(null);
    try {
      const user = await lookup.mutateAsync(usernameInput.replace(/^@/, ''));
      setRecipient(user);
    } catch {
      // error surfaced via lookup.isError below
    }
  }

  async function send(giftId: string) {
    if (!recipient) return;
    await sendGift.mutateAsync({ recipientId: recipient.id, giftCatalogItemId: giftId });
    setSentGiftId(giftId);
    setTimeout(() => setSentGiftId(null), 2500);
  }

  return (
    <AppShell>
      <form onSubmit={findRecipient} className="recipientForm">
        <span className="recipientLabel">Кому:</span>
        <input
          className="recipientInput"
          value={usernameInput}
          onChange={(e) => setUsernameInput(e.target.value)}
          placeholder="username отримувача"
        />
        <Button label="Знайти" variant="secondary" type="submit" onClick={() => {}} loading={lookup.isPending} />
      </form>

      {lookup.isError && (
        <p className="lookupError">
          {lookup.error instanceof ApiError && lookup.error.status === 404
            ? 'Користувача не знайдено.'
            : 'Не вдалося знайти користувача.'}
        </p>
      )}

      {recipient && (
        <div className="recipientChip">
          Надсилаємо <strong>@{recipient.username}</strong>
          <span onClick={() => setRecipient(null)} className="clearRecipient">
            ✕
          </span>
        </div>
      )}

      <div className="filters">
        <button className={!rarity ? 'chip chipActive' : 'chip'} onClick={() => setRarity(undefined)}>
          Усі
        </button>
        {Object.entries(RARITY_LABELS).map(([key, label]) => (
          <button key={key} className={rarity === key ? 'chip chipActive' : 'chip'} onClick={() => setRarity(key)}>
            {label}
          </button>
        ))}
      </div>

      {store.isLoading && <Skeleton height={200} />}
      {store.isError && (
        <ErrorState message={store.error instanceof Error ? store.error.message : 'Не вдалося завантажити магазин.'} onRetry={() => store.refetch()} />
      )}
      {store.data && store.data.length === 0 && <EmptyState title="Порожньо" message="У цій категорії поки немає подарунків." />}

      {store.data && store.data.length > 0 && (
        <div className="list">
          {store.data.map((item) => (
            <div key={item.id} className="row">
              <div className="icon">{item.isAnimated && '✨'}</div>
              <div style={{ flex: 1 }}>
                <p className="name">{item.name}</p>
                <p className="rarity">{RARITY_LABELS[item.rarity] ?? item.rarity}</p>
              </div>
              <span className="price">{Number(item.coinCost).toLocaleString('uk-UA')} 🪙</span>
              <Button
                label={sentGiftId === item.id ? 'Надіслано ✓' : 'Надіслати'}
                onClick={() => send(item.id)}
                disabled={!recipient || sendGift.isPending}
                loading={sendGift.isPending}
              />
            </div>
          ))}
        </div>
      )}

      {sendGift.isError && (
        <p className="lookupError">{sendGift.error instanceof Error ? sendGift.error.message : 'Не вдалося надіслати подарунок.'}</p>
      )}

      <style jsx>{`
        .recipientForm { display: flex; gap: 8px; align-items: center; margin-bottom: 8px; }
        .recipientLabel { font-size: 13px; font-weight: 600; color: var(--text-secondary); }
        .recipientInput { flex: 1; max-width: 240px; padding: 8px 12px; border-radius: 8px; border: 1.5px solid var(--color-border); font-size: 14px; }
        .lookupError { color: var(--color-error); font-size: 13px; margin-bottom: 12px; }
        .recipientChip { display: inline-flex; align-items: center; gap: 8px; background: var(--color-wheat-soft); padding: 6px 12px; border-radius: 999px; font-size: 13px; margin-bottom: 16px; }
        .clearRecipient { cursor: pointer; color: var(--text-secondary); font-weight: 700; }
        .filters { display: flex; gap: 8px; margin-bottom: 16px; flex-wrap: wrap; }
        .chip { font-size: 12px; font-weight: 600; color: var(--text-secondary); padding: 6px 12px; border-radius: 999px; background: var(--surface-elevated); border: none; cursor: pointer; }
        .chipActive { background: var(--color-wheat); color: var(--color-chornozem); }
        .list { display: flex; flex-direction: column; gap: 8px; }
        .row { display: flex; align-items: center; gap: 12px; background: var(--surface-elevated); border-radius: 12px; padding: 12px; }
        .icon { width: 44px; height: 44px; border-radius: 8px; background: var(--color-chicory-soft); display: flex; align-items: center; justify-content: center; }
        .name { font-size: 14px; font-weight: 700; margin: 0; }
        .rarity { font-size: 11px; color: var(--text-secondary); margin: 2px 0 0; }
        .price { font-size: 13px; font-weight: 700; background: var(--color-wheat-soft); padding: 6px 10px; border-radius: 8px; }
      `}</style>
    </AppShell>
  );
}
