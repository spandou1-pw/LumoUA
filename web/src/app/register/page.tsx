'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useRegister, useVerifyEmail, ApiError } from '../../api/hooks';
import { Button } from '../../components/ui';

export default function RegisterPage() {
  const router = useRouter();
  const [step, setStep] = useState<'credentials' | 'verify'>('credentials');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [code, setCode] = useState('');
  const [error, setError] = useState<string | null>(null);
  const register = useRegister();
  const verify = useVerifyEmail();

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    try {
      await register.mutateAsync({ email, password });
      setStep('verify');
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Перевірте з'єднання.");
    }
  }

  async function handleVerify(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    try {
      await verify.mutateAsync({ email, code });
      router.replace('/login');
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Перевірте з'єднання.");
    }
  }

  return (
    <main className="wrap">
      {step === 'credentials' ? (
        <form onSubmit={handleRegister} className="form">
          <h1 className="title">Створити акаунт</h1>
          <label className="field">
            <span>Пошта</span>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
          </label>
          <label className="field">
            <span>Пароль</span>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              minLength={8}
              required
            />
          </label>
          {error && <p role="alert" className="error">{error}</p>}
          <Button type="submit" label="Продовжити" onClick={() => {}} loading={register.isPending} />
        </form>
      ) : (
        <form onSubmit={handleVerify} className="form">
          <h1 className="title">Підтвердіть пошту</h1>
          <p className="subtitle">Ми надіслали код на {email}</p>
          <input
            className="code"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            maxLength={6}
            placeholder="000000"
            aria-label="Код підтвердження"
          />
          {error && <p role="alert" className="error">{error}</p>}
          <Button type="submit" label="Підтвердити" onClick={() => {}} loading={verify.isPending} disabled={code.length !== 6} />
        </form>
      )}

      <style jsx>{`
        .wrap { min-height: 100vh; display: flex; align-items: center; justify-content: center; background: var(--color-stone); }
        .form { width: 340px; display: flex; flex-direction: column; gap: 14px; }
        .title { font-size: 20px; font-weight: 700; color: var(--color-chornozem); margin: 0; }
        .subtitle { font-size: 13px; color: var(--text-secondary); margin: 0 0 8px; }
        .field { display: flex; flex-direction: column; gap: 6px; font-size: 13px; font-weight: 600; }
        .field input { padding: 12px 14px; border-radius: 8px; border: 1.5px solid var(--color-border); font-size: 15px; }
        .code { padding: 14px; font-size: 22px; letter-spacing: 6px; text-align: center; border-radius: 8px; border: 1.5px solid var(--color-border); }
        .error { color: var(--color-error); font-size: 13px; margin: 0; }
      `}</style>
    </main>
  );
}
