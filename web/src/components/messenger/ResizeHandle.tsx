'use client';

import React, { useCallback, useEffect, useRef } from 'react';

export function ResizeHandle({ onDrag, minWidth, maxWidth }: {
  onDrag: (delta: number) => void;
  minWidth?: number;
  maxWidth?: number;
}) {
  const dragging = useRef(false);
  const startX = useRef(0);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    dragging.current = true;
    startX.current = e.clientX;
    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';
  }, []);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!dragging.current) return;
      const delta = e.clientX - startX.current;
      startX.current = e.clientX;
      onDrag(delta);
    };
    const handleMouseUp = () => {
      if (!dragging.current) return;
      dragging.current = false;
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [onDrag]);

  return (
    <div className="resize-handle" onMouseDown={handleMouseDown}>
      <div className="resize-line" />
      <style jsx>{`
        .resize-handle {
          width: 5px; cursor: col-resize; flex-shrink: 0;
          display: flex; align-items: center; justify-content: center;
          position: relative; z-index: 10;
          transition: background var(--duration-fast) var(--ease-smooth);
        }
        .resize-handle:hover { background: var(--accent-light); }
        .resize-handle:hover .resize-line { opacity: 1; background: var(--accent); }
        .resize-line {
          width: 3px; height: 32px; border-radius: 2px;
          background: var(--border); opacity: 0.5;
          transition: all var(--duration-fast) var(--ease-smooth);
        }
      `}</style>
    </div>
  );
}
