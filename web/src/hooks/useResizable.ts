'use client';

import { useState, useCallback, useEffect } from 'react';

const STORAGE_KEY = 'messenger_panel_widths';

interface PanelWidths {
  chatList: number;
  infoPanel: number;
}

const DEFAULTS: PanelWidths = { chatList: 360, infoPanel: 340 };
const MIN_LIST = 280;
const MAX_LIST = 500;
const MIN_INFO = 280;
const MAX_INFO = 480;

function loadSaved(): PanelWidths {
  if (typeof window === 'undefined') return DEFAULTS;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULTS;
    const parsed = JSON.parse(raw);
    return {
      chatList: Math.max(MIN_LIST, Math.min(MAX_LIST, parsed.chatList || DEFAULTS.chatList)),
      infoPanel: Math.max(MIN_INFO, Math.min(MAX_INFO, parsed.infoPanel || DEFAULTS.infoPanel)),
    };
  } catch {
    return DEFAULTS;
  }
}

function save(widths: PanelWidths) {
  if (typeof window === 'undefined') return;
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(widths)); } catch {}
}

export function useResizable() {
  const [widths, setWidths] = useState<PanelWidths>(DEFAULTS);

  useEffect(() => {
    setWidths(loadSaved());
  }, []);

  const onChatListDrag = useCallback((delta: number) => {
    setWidths((prev) => {
      const next = {
        ...prev,
        chatList: Math.max(MIN_LIST, Math.min(MAX_LIST, prev.chatList + delta)),
      };
      save(next);
      return next;
    });
  }, []);

  const onInfoPanelDrag = useCallback((delta: number) => {
    setWidths((prev) => {
      const next = {
        ...prev,
        infoPanel: Math.max(MIN_INFO, Math.min(MAX_INFO, prev.infoPanel - delta)),
      };
      save(next);
      return next;
    });
  }, []);

  return { widths, onChatListDrag, onInfoPanelDrag };
}
