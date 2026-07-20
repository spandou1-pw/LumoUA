'use client';

import React from 'react';

export function TypingIndicator({ name }: { name: string }) {
  return (
    <div className="typing">
      <div className="typing-bubble">
        <span className="typing-dot" />
        <span className="typing-dot" />
        <span className="typing-dot" />
      </div>
      <span className="typing-label">{name} друкує...</span>
      <style jsx>{`
        .typing {
          display: flex; align-items: center; gap: 8px;
          padding: 4px 16px; animation: fadeIn 0.2s var(--ease-smooth);
        }
        .typing-bubble {
          display: flex; align-items: center; gap: 3px;
          padding: 10px 14px; border-radius: 18px 18px 18px 4px;
          background: var(--fill);
        }
        .typing-dot {
          width: 6px; height: 6px; border-radius: 50%;
          background: var(--text-tertiary);
          animation: typingBounce 1.2s ease-in-out infinite;
        }
        .typing-dot:nth-child(2) { animation-delay: 0.15s; }
        .typing-dot:nth-child(3) { animation-delay: 0.3s; }
        .typing-label {
          font-size: 12px; color: var(--text-tertiary); font-style: italic;
        }
        @keyframes typingBounce {
          0%, 60%, 100% { transform: translateY(0); opacity: 0.4; }
          30% { transform: translateY(-4px); opacity: 1; }
        }
      `}</style>
    </div>
  );
}
