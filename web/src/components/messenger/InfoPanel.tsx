'use client';

import React from 'react';
import { Avatar } from '../ui';
import { Conversation } from '../../api/hooks';

function InfoSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="info-section">
      <h3 className="info-section-title">{title}</h3>
      {children}
      <style jsx>{`
        .info-section { padding: 16px; border-bottom: 1px solid var(--border-light); }
        .info-section-title {
          font-size: 13px; font-weight: 700; color: var(--text-secondary);
          text-transform: uppercase; letter-spacing: 0.04em;
          margin-bottom: 12px;
        }
      `}</style>
    </div>
  );
}

export function InfoPanel({ conversation, onClose }: {
  conversation: Conversation;
  onClose: () => void;
}) {
  const name = conversation.participantNames?.[0] || 'Бесіда';

  return (
    <div className="info-panel">
      <div className="info-header">
        <button className="info-close" onClick={onClose} title="Закрити">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>
        <span className="info-header-title">Інформація</span>
      </div>

      <div className="info-profile">
        <Avatar name={name} size={72} />
        <span className="info-profile-name">{name}</span>
        <span className="info-profile-status">в мережі</span>
      </div>

      <InfoSection title="Дії">
        <div className="info-actions">
          <button className="info-action">
            <div className="info-action-icon">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6 19.79 19.79 0 01-3.07-8.67A2 2 0 014.11 2h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 16.92z" />
              </svg>
            </div>
            <span>Зателефонувати</span>
          </button>
          <button className="info-action">
            <div className="info-action-icon">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polygon points="23,7 16,12 23,17" />
                <rect x="1" y="5" width="15" height="14" rx="2" ry="2" />
              </svg>
            </div>
            <span>Відеозв'язок</span>
          </button>
          <button className="info-action">
            <div className="info-action-icon">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" />
                <circle cx="12" cy="7" r="4" />
              </svg>
            </div>
            <span>Переглянути профіль</span>
          </button>
        </div>
      </InfoSection>

      <InfoSection title="Спільні медіа">
        <div className="info-shared-empty">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--text-tertiary)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
            <circle cx="8.5" cy="8.5" r="1.5" />
            <polyline points="21,15 16,10 5,21" />
          </svg>
          <span>Поки що немає медіа</span>
        </div>
      </InfoSection>

      <InfoSection title="Налаштування">
        <div className="info-settings">
          <label className="info-toggle">
            <span>Сповіщення</span>
            <div className="info-toggle-track">
              <div className="info-toggle-thumb" />
            </div>
          </label>
          <label className="info-toggle">
            <span>Звуки повідомлень</span>
            <div className="info-toggle-track">
              <div className="info-toggle-thumb" />
            </div>
          </label>
        </div>
      </InfoSection>

      <style jsx>{`
        .info-panel {
          display: flex; flex-direction: column; height: 100%;
          background: var(--bg-primary);
          border-left: 1px solid var(--border-light);
          animation: slideInRight 0.2s var(--ease-smooth);
        }
        .info-header {
          display: flex; align-items: center; gap: 8px;
          padding: 12px 16px;
          border-bottom: 1px solid var(--border-light);
          flex-shrink: 0;
        }
        .info-close {
          display: flex; align-items: center; justify-content: center;
          width: 30px; height: 30px; border-radius: 50%;
          color: var(--text-secondary);
          transition: all var(--duration-fast) var(--ease-smooth);
        }
        .info-close:hover { background: var(--fill-hover); color: var(--text); }
        .info-header-title {
          font-size: 15px; font-weight: 700;
        }
        .info-profile {
          display: flex; flex-direction: column; align-items: center;
          padding: 24px 16px 16px; gap: 8px;
        }
        .info-profile-name { font-size: 18px; font-weight: 700; }
        .info-profile-status { font-size: 13px; color: var(--success); font-weight: 500; }
        .info-actions {
          display: flex; flex-direction: column; gap: 2px;
        }
        .info-action {
          display: flex; align-items: center; gap: 12px;
          padding: 10px 8px; border-radius: var(--radius-sm);
          font-size: 14px; color: var(--text);
          transition: background var(--duration-fast) var(--ease-smooth);
        }
        .info-action:hover { background: var(--fill-hover); }
        .info-action-icon {
          width: 36px; height: 36px; border-radius: 50%;
          background: var(--fill); display: flex;
          align-items: center; justify-content: center;
          color: var(--accent);
        }
        .info-shared-empty {
          display: flex; align-items: center; gap: 10px;
          padding: 12px; border-radius: var(--radius-sm);
          background: var(--fill); color: var(--text-tertiary);
          font-size: 13px;
        }
        .info-settings {
          display: flex; flex-direction: column; gap: 4px;
        }
        .info-toggle {
          display: flex; align-items: center; justify-content: space-between;
          padding: 8px 0; font-size: 14px; cursor: pointer;
        }
        .info-toggle-track {
          width: 42px; height: 26px; border-radius: 13px;
          background: var(--fill-active); position: relative;
          transition: background var(--duration-fast) var(--ease-smooth);
        }
        .info-toggle-thumb {
          width: 22px; height: 22px; border-radius: 50%;
          background: white; position: absolute; top: 2px; left: 2px;
          box-shadow: 0 1px 3px rgba(0,0,0,0.15);
          transition: transform var(--duration-fast) var(--ease-smooth);
        }
        .info-toggle:hover .info-toggle-track { background: var(--accent); }
        .info-toggle:hover .info-toggle-thumb { transform: translateX(16px); }
      `}</style>
    </div>
  );
}
