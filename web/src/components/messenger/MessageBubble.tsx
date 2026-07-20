'use client';

import React, { useState, useRef, useCallback } from 'react';
import { Message, useMe, useDeleteMessage, useEditMessage } from '../../api/hooks';
import { ContextMenu, ContextMenuItem } from './ContextMenu';

function formatTime(dateStr: string): string {
  return new Date(dateStr).toLocaleTimeString('uk-UA', { hour: '2-digit', minute: '2-digit' });
}

export function MessageBubble({ message, onContextMenu }: {
  message: Message;
  onContextMenu?: (e: React.MouseEvent) => void;
}) {
  const me = useMe();
  const deleteMessage = useDeleteMessage();
  const editMessage = useEditMessage();
  const myId = me.data?.id;
  const isMine = myId ? message.senderId === myId : false;
  const [ctx, setCtx] = useState<{ x: number; y: number } | null>(null);
  const [editing, setEditing] = useState(false);
  const [editText, setEditText] = useState(message.ciphertext);
  const editRef = useRef<HTMLTextAreaElement>(null);

  const handleContextMenu = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    if (isMine) {
      setCtx({ x: e.clientX, y: e.clientY });
    }
    onContextMenu?.(e);
  }, [isMine, onContextMenu]);

  const items: ContextMenuItem[] = isMine ? [
    {
      label: 'Редагувати',
      icon: (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" />
          <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" />
        </svg>
      ),
      onClick: () => {
        setEditText(message.ciphertext);
        setEditing(true);
        setTimeout(() => editRef.current?.focus(), 50);
      },
    },
    {
      label: 'Видалити',
      icon: (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="3,6 5,6 21,6" />
          <path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" />
        </svg>
      ),
      danger: true,
      onClick: () => deleteMessage.mutate(message.id),
    },
  ] : [];

  const handleEditSave = () => {
    const trimmed = editText.trim();
    if (!trimmed || trimmed === message.ciphertext) {
      setEditing(false);
      return;
    }
    editMessage.mutate({ messageId: message.id, body: trimmed }, {
      onSuccess: () => setEditing(false),
    });
  };

  const handleEditKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleEditSave();
    }
    if (e.key === 'Escape') {
      setEditing(false);
      setEditText(message.ciphertext);
    }
  };

  return (
    <div
      className={`mb ${isMine ? 'mine' : ''}`}
      onContextMenu={handleContextMenu}
    >
      <div className={`mb-bubble ${editing ? 'editing' : ''}`}>
        {editing ? (
          <div className="mb-edit">
            <textarea
              ref={editRef}
              className="mb-edit-input"
              value={editText}
              onChange={(e) => setEditText(e.target.value)}
              onKeyDown={handleEditKeyDown}
              rows={1}
            />
            <div className="mb-edit-actions">
              <button className="mb-edit-btn cancel" onClick={() => { setEditing(false); setEditText(message.ciphertext); }}>
                Скасувати
              </button>
              <button className="mb-edit-btn save" onClick={handleEditSave} disabled={editMessage.isPending}>
                Зберегти
              </button>
            </div>
          </div>
        ) : (
          <span className="mb-text">{message.ciphertext}</span>
        )}
      </div>
      <div className="mb-meta">
        <span className="mb-time">{formatTime(message.createdAt)}</span>
        {isMine && (
          <span className="mb-check">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="20,6 9,17 4,12" />
            </svg>
          </span>
        )}
      </div>
      {ctx && (
        <ContextMenu items={items} x={ctx.x} y={ctx.y} onClose={() => setCtx(null)} />
      )}
      <style jsx>{`
        .mb {
          display: flex; flex-direction: column;
          max-width: 65%; animation: fadeIn 0.15s var(--ease-smooth);
          position: relative;
        }
        .mb.mine { align-self: flex-end; align-items: flex-end; }
        .mb:not(.mine) { align-self: flex-start; align-items: flex-start; }
        .mb-bubble {
          padding: 9px 14px; font-size: 15px; line-height: 1.45;
          word-break: break-word; position: relative;
          border-radius: 18px 18px 18px 4px;
          background: var(--fill); color: var(--text);
          transition: background var(--duration-fast) var(--ease-smooth);
        }
        .mb.mine .mb-bubble {
          background: var(--accent); color: white;
          border-radius: 18px 18px 4px 18px;
        }
        .mb-bubble.editing {
          padding: 4px; background: var(--bg-primary);
          border: 1.5px solid var(--accent);
        }
        .mb:not(.mine):hover .mb-bubble { background: var(--fill-hover); }
        .mb.mine:hover .mb-bubble { filter: brightness(1.05); }
        .mb-text { user-select: text; }
        .mb-edit { display: flex; flex-direction: column; width: 100%; min-width: 200px; }
        .mb-edit-input {
          width: 100%; border: none; background: none; outline: none;
          font-size: 15px; line-height: 1.45; color: var(--text);
          resize: none; padding: 6px 8px; font-family: inherit;
          min-height: 24px; max-height: 200px;
        }
        .mb-edit-actions {
          display: flex; justify-content: flex-end; gap: 8px; padding: 4px 4px 2px;
        }
        .mb-edit-btn {
          font-size: 12px; font-weight: 600; padding: 4px 10px;
          border-radius: var(--radius-full); cursor: pointer;
          transition: all var(--duration-fast) var(--ease-smooth);
        }
        .mb-edit-btn.cancel { color: var(--text-secondary); }
        .mb-edit-btn.cancel:hover { background: var(--fill); }
        .mb-edit-btn.save { background: var(--accent); color: white; }
        .mb-edit-btn.save:hover { background: var(--accent-hover); }
        .mb-edit-btn.save:disabled { opacity: 0.5; cursor: not-allowed; }
        .mb-meta {
          display: flex; align-items: center; gap: 3px;
          padding: 2px 6px 0;
        }
        .mb-time {
          font-size: 11px; color: var(--text-tertiary);
        }
        .mb.mine .mb-time { color: var(--text-tertiary); }
        .mb-check { display: flex; color: var(--accent); opacity: 0.7; }
        .mb.mine .mb-check { color: var(--text-tertiary); }
      `}</style>
    </div>
  );
}
