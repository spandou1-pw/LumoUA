'use client';

import React, { useEffect, useRef, useCallback } from 'react';

export interface ContextMenuItem {
  label: string;
  icon?: React.ReactNode;
  onClick: () => void;
  danger?: boolean;
  separator?: boolean;
}

export function ContextMenu({ items, x, y, onClose }: {
  items: ContextMenuItem[];
  x: number;
  y: number;
  onClose: () => void;
}) {
  const ref = useRef<HTMLDivElement>(null);

  const handleMouseDown = useCallback((e: MouseEvent) => {
    if (ref.current && !ref.current.contains(e.target as Node)) onClose();
  }, [onClose]);

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.key === 'Escape') onClose();
  }, [onClose]);

  useEffect(() => {
    document.addEventListener('mousedown', handleMouseDown);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleMouseDown);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [handleMouseDown, handleKeyDown]);

  useEffect(() => {
    if (!ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    if (rect.right > vw) ref.current.style.left = `${vw - rect.width - 8}px`;
    if (rect.bottom > vh) ref.current.style.top = `${vh - rect.height - 8}px`;
  }, [x, y]);

  return (
    <div ref={ref} className="ctx-overlay" style={{ left: x, top: y }}>
      {items.map((item, i) => {
        if (item.separator) return <div key={i} className="ctx-sep" />;
        return (
          <button
            key={i}
            className={`ctx-item ${item.danger ? 'danger' : ''}`}
            onClick={() => { item.onClick(); onClose(); }}
          >
            {item.icon && <span className="ctx-icon">{item.icon}</span>}
            <span>{item.label}</span>
          </button>
        );
      })}
      <style jsx>{`
        .ctx-overlay {
          position: fixed; z-index: 1000;
          min-width: 180px; padding: 4px;
          background: var(--bg-elevated);
          border: 1px solid var(--border-light);
          border-radius: var(--radius);
          box-shadow: 0 8px 32px rgba(0,0,0,0.18), 0 2px 8px rgba(0,0,0,0.08);
          animation: ctxIn 0.12s var(--ease-smooth);
        }
        @keyframes ctxIn {
          from { opacity: 0; transform: scale(0.95); }
          to { opacity: 1; transform: scale(1); }
        }
        .ctx-item {
          display: flex; align-items: center; gap: 10px;
          width: 100%; padding: 8px 12px; border: none; background: none;
          border-radius: var(--radius-sm); font-size: 14px; color: var(--text);
          cursor: pointer; text-align: left; white-space: nowrap;
          transition: background var(--duration-fast) var(--ease-smooth);
        }
        .ctx-item:hover { background: var(--fill-hover); }
        .ctx-item.danger { color: var(--error); }
        .ctx-item.danger:hover { background: var(--error-light); }
        .ctx-icon { display: flex; width: 18px; height: 18px; flex-shrink: 0; color: var(--text-secondary); }
        .ctx-item.danger .ctx-icon { color: var(--error); }
        .ctx-sep { height: 1px; background: var(--border-light); margin: 4px 8px; }
      `}</style>
    </div>
  );
}
