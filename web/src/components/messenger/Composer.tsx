'use client';

import React, { useState, useRef, useCallback, useEffect } from 'react';

export function Composer({ onSend, disabled }: {
  onSend: (text: string) => void;
  disabled?: boolean;
}) {
  const [text, setText] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const hasText = text.trim().length > 0;

  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = `${Math.min(el.scrollHeight, 160)}px`;
  }, [text]);

  const handleSend = useCallback(() => {
    const trimmed = text.trim();
    if (!trimmed || disabled) return;
    onSend(trimmed);
    setText('');
    if (textareaRef.current) textareaRef.current.style.height = 'auto';
  }, [text, disabled, onSend]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }, [handleSend]);

  return (
    <div className="composer">
      <button className="cmp-action" title="Прикріпити файл" disabled={disabled}>
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="var(--text-tertiary)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21.44 11.05l-9.19 9.19a6 6 0 01-8.49-8.49l9.19-9.19a4 4 0 015.66 5.66l-9.2 9.19a2 2 0 01-2.83-2.83l8.49-8.48" />
        </svg>
      </button>

      <div className="cmp-input-wrap">
        <textarea
          ref={textareaRef}
          className="cmp-input"
          placeholder="Повідомлення..."
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={handleKeyDown}
          rows={1}
          disabled={disabled}
        />
      </div>

      {hasText ? (
        <button className="cmp-send" onClick={handleSend} disabled={disabled} title="Надіслати">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
            <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" fill="white" />
          </svg>
        </button>
      ) : (
        <button className="cmp-action" title="Емодзі" disabled={disabled}>
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="var(--text-tertiary)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10" />
            <path d="M8 14s1.5 2 4 2 4-2 4-2" />
            <line x1="9" y1="9" x2="9.01" y2="9" strokeWidth="2.5" />
            <line x1="15" y1="9" x2="15.01" y2="9" strokeWidth="2.5" />
          </svg>
        </button>
      )}

      <style jsx>{`
        .composer {
          display: flex; align-items: flex-end; gap: 6px;
          padding: 10px 12px;
          border-top: 1px solid var(--border-light);
          background: var(--bg-primary);
        }
        .cmp-input-wrap {
          flex: 1; display: flex; align-items: flex-end;
          background: var(--fill); border-radius: 20px;
          padding: 0 14px; min-height: 40px;
          transition: all var(--duration-fast) var(--ease-smooth);
        }
        .cmp-input-wrap:focus-within {
          background: var(--bg); box-shadow: 0 0 0 2px var(--accent-light);
        }
        .cmp-input {
          flex: 1; border: none; background: none; outline: none;
          font-size: 15px; color: var(--text); line-height: 1.45;
          padding: 9px 0; resize: none; font-family: inherit;
          min-height: 22px; max-height: 160px;
        }
        .cmp-input::placeholder { color: var(--text-tertiary); }
        .cmp-input:disabled { opacity: 0.5; }
        .cmp-action {
          display: flex; align-items: center; justify-content: center;
          width: 38px; height: 38px; border-radius: 50%; flex-shrink: 0;
          transition: background var(--duration-fast) var(--ease-smooth);
        }
        .cmp-action:hover:not(:disabled) { background: var(--fill-hover); }
        .cmp-action:disabled { opacity: 0.3; cursor: not-allowed; }
        .cmp-send {
          display: flex; align-items: center; justify-content: center;
          width: 38px; height: 38px; border-radius: 50%; flex-shrink: 0;
          background: var(--accent); border: none; cursor: pointer;
          transition: all var(--duration-fast) var(--ease-smooth);
          box-shadow: 0 2px 8px rgba(0, 122, 255, 0.3);
        }
        .cmp-send:hover { background: var(--accent-hover); }
        .cmp-send:active { transform: scale(0.9); }
        .cmp-send:disabled { opacity: 0.5; cursor: not-allowed; }
      `}</style>
    </div>
  );
}
