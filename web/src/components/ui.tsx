'use client';

import React from 'react';

interface ButtonProps {
  label: string;
  onClick: () => void;
  variant?: 'primary' | 'secondary';
  disabled?: boolean;
  loading?: boolean;
  type?: 'button' | 'submit';
}

export function Button({ label, onClick, variant = 'primary', disabled, loading, type = 'button' }: ButtonProps) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled || loading}
      aria-busy={loading}
      className={`btn btn-${variant}`}
    >
      {loading ? '…' : label}
      <style jsx>{`
        .btn {
          height: 44px;
          padding: 0 20px;
          border-radius: var(--radius-small);
          font-size: 15px;
          font-weight: 600;
          border: none;
          cursor: pointer;
          transition: transform var(--motion-instant) ease;
        }
        .btn:active:not(:disabled) {
          transform: scale(0.97);
        }
        .btn:disabled {
          background: var(--color-border) !important;
          color: var(--text-secondary) !important;
          cursor: not-allowed;
        }
        .btn-primary {
          background: var(--color-wheat);
          color: var(--color-chornozem);
        }
        .btn-secondary {
          background: transparent;
          border: 1.5px solid var(--color-chicory);
          color: var(--color-chicory);
        }
      `}</style>
    </button>
  );
}

export function ErrorState({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <div role="alert" className="state">
      <p className="title">Щось пішло не так</p>
      <p className="message">{message}</p>
      {onRetry && <Button label="Спробувати ще раз" variant="secondary" onClick={onRetry} />}
      <style jsx>{stateStyles}</style>
    </div>
  );
}

export function EmptyState({
  title,
  message,
  actionLabel,
  onAction,
}: {
  title: string;
  message: string;
  actionLabel?: string;
  onAction?: () => void;
}) {
  return (
    <div className="state">
      <p className="title">{title}</p>
      <p className="message">{message}</p>
      {actionLabel && onAction && <Button label={actionLabel} onClick={onAction} />}
      <style jsx>{stateStyles}</style>
    </div>
  );
}

const stateStyles = `
  .state { display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 48px 24px; gap: 12px; text-align: center; }
  .title { font-weight: 700; font-size: 17px; color: var(--text); margin: 0; }
  .message { font-size: 14px; color: var(--text-secondary); margin: 0 0 4px; }
`;

export function Skeleton({ width = '100%', height = 16 }: { width?: string | number; height?: number }) {
  return (
    <div
      style={{
        width,
        height,
        borderRadius: 8,
        background: 'var(--color-border)',
        animation: 'pulse 1.2s ease-in-out infinite',
      }}
    >
      <style jsx global>{`
        @keyframes pulse {
          0%,
          100% {
            opacity: 0.4;
          }
          50% {
            opacity: 0.9;
          }
        }
      `}</style>
    </div>
  );
}
