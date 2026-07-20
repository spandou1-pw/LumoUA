'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useLogin, ApiError } from '../../api/hooks';
import { Button } from '../../components/ui';

const ERROR_MESSAGES: Record<string, string> = {
  INVALID_CREDENTIALS: 'Невірна пошта або пароль.',
  ACCOUNT_NOT_ACTIVE: 'Обліковий запис призупинено.',
};

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const login = useLogin();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    try {
      await login.mutateAsync({ email, password });
      router.replace('/feed');
    } catch (err) {
      setError(err instanceof ApiError ? (ERROR_MESSAGES[err.code] ?? err.message) : "Перевірте з'єднання.");
    }
  }

  return (
    <main className="wrap">
      <form onSubmit={handleSubmit} className="form">
        <h1 className="wordmark">Lumo</h1>
        <h2 className="title">З поверненням</h2>

        <label className="field">
          <span>Пошта</span>
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required autoComplete="email" />
        </label>
        <label className="field">
          <span>Пароль</span>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            autoComplete="current-password"
          />
        </label>

        {error && <p role="alert" className="error">{error}</p>}

        <Button type="submit" label="Увійти" onClick={() => {}} loading={login.isPending} disabled={!email || !password} />

        <p className="footer">
          Немає акаунту? <Link href="/register">Зареєструватися</Link>
        </p>
      </form>

      <style jsx>{`
        .wrap { min-height: 100vh; display: flex; align-items: center; justify-content: center; background: var(--color-stone); }
        .form { width: 340px; display: flex; flex-direction: column; gap: 14px; }
        .wordmark { font-size: 24px; font-weight: 800; color: var(--color-chornozem); margin: 0; }
        .title { font-size: 20px; font-weight: 700; color: var(--color-chornozem); margin: 0 0 8px; }
        .field { display: flex; flex-direction: column; gap: 6px; font-size: 13px; font-weight: 600; color: var(--text); }
        .field input { padding: 12px 14px; border-radius: 8px; border: 1.5px solid var(--color-border); font-size: 15px; }
        .error { color: var(--color-error); font-size: 13px; margin: 0; }
        .footer { text-align: center; font-size: 13.5px; color: var(--text-secondary); margin-top: 12px; }
      `}</style>
    </main>
  );
}
