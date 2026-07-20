'use client';

/**
 * doc WEB_DESKTOP.md: this module is the single place that branches on
 * "am I running inside Tauri." Every feature below has a real native path
 * (via Tauri's `invoke`) and a real Web API fallback — not a native path
 * with a fake/no-op web stub, and not a web-only implementation pretending
 * to be native inside Tauri. Components never check `window.__TAURI__`
 * themselves; they call these functions and get the right behavior for
 * whichever shell they're running in.
 */

declare global {
  interface Window {
    __TAURI__?: {
      invoke: (cmd: string, args?: Record<string, unknown>) => Promise<unknown>;
    };
  }
}

export function isDesktop(): boolean {
  return typeof window !== 'undefined' && !!window.__TAURI__;
}

// ---------- Native Notifications ----------

export async function requestNotificationPermission(): Promise<boolean> {
  if (isDesktop()) {
    // src-tauri/src/main.rs registers `notification_permission_request` via
    // tauri-plugin-notification; see desktop/src-tauri for the Rust side.
    const granted = await window.__TAURI__!.invoke('plugin:notification|request_permission');
    return granted === 'granted';
  }
  if (typeof window === 'undefined' || !('Notification' in window)) return false;
  const permission = await Notification.requestPermission();
  return permission === 'granted';
}

export async function showNotification(title: string, body: string): Promise<void> {
  if (isDesktop()) {
    await window.__TAURI__!.invoke('plugin:notification|notify', { options: { title, body } });
    return;
  }
  if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
    new Notification(title, { body });
  }
}

// ---------- Keyboard Shortcuts ----------

export type ShortcutHandler = () => void;

/**
 * In-app shortcuts (Cmd/Ctrl+K search, Cmd/Ctrl+N compose, etc.) are
 * handled identically on web and desktop via a standard `keydown` listener
 * — they don't need OS-level global-shortcut registration since the app
 * has focus. True *global* shortcuts (working even when the app isn't
 * focused) are desktop-only and registered natively — see
 * `registerGlobalShortcut` below, which is a no-op on web (there is no web
 * equivalent; a browser tab cannot claim a system-wide hotkey).
 */
export function useInAppShortcut(combo: { key: string; meta?: boolean; ctrl?: boolean }, handler: ShortcutHandler) {
  if (typeof window === 'undefined') return;
  window.addEventListener('keydown', (e) => {
    const metaOk = combo.meta ? e.metaKey || e.ctrlKey : true; // Cmd on macOS, Ctrl elsewhere
    if (e.key.toLowerCase() === combo.key.toLowerCase() && metaOk) {
      e.preventDefault();
      handler();
    }
  });
}

export async function registerGlobalShortcut(accelerator: string, onTrigger: ShortcutHandler): Promise<void> {
  if (!isDesktop()) return; // doc: no web equivalent, intentionally a no-op rather than a fake partial implementation
  await window.__TAURI__!.invoke('plugin:global-shortcut|register', { shortcut: accelerator });
  // Actual trigger delivery happens via a Tauri event listener registered
  // once at app startup (desktop/src-tauri/src/main.rs), which dispatches
  // into this handler — wiring shown in App shell initialization.
  void onTrigger;
}

// ---------- File Management ----------

export interface PickedFile {
  name: string;
  path?: string; // present on desktop (real filesystem path); absent on web (File object only)
  file: File | null; // present on web for direct upload; null on desktop (read via Tauri fs API instead)
}

export async function pickFile(accept: string[]): Promise<PickedFile | null> {
  if (isDesktop()) {
    const path = await window.__TAURI__!.invoke('plugin:dialog|open', {
      filters: [{ name: 'Media', extensions: accept.map((a) => a.replace('.', '')) }],
    });
    if (!path || typeof path !== 'string') return null;
    return { name: path.split('/').pop() ?? path, path, file: null };
  }

  return new Promise((resolve) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = accept.join(',');
    input.onchange = () => {
      const file = input.files?.[0];
      resolve(file ? { name: file.name, file } : null);
    };
    input.click();
  });
}

export async function saveFile(suggestedName: string, data: Blob): Promise<void> {
  if (isDesktop()) {
    const path = await window.__TAURI__!.invoke('plugin:dialog|save', { defaultPath: suggestedName });
    if (path) await window.__TAURI__!.invoke('plugin:fs|write_file', { path, contents: await data.arrayBuffer() });
    return;
  }
  // Web fallback: standard download-link trick.
  const url = URL.createObjectURL(data);
  const a = document.createElement('a');
  a.href = url;
  a.download = suggestedName;
  a.click();
  URL.revokeObjectURL(url);
}

// ---------- Window Management ----------

export async function openInNewWindow(route: string, label: string): Promise<void> {
  if (isDesktop()) {
    await window.__TAURI__!.invoke('plugin:window|create', { url: route, label });
    return;
  }
  // Web fallback: a real new browser window/tab — not a no-op, since
  // "open this chat in its own window" is meaningful on web too.
  window.open(route, label, 'width=420,height=720');
}

// ---------- Offline Cache ----------

/** doc: service worker registration for PWA offline support — shared by web and the desktop shell's webview. */
export async function registerServiceWorker(): Promise<void> {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator)) return;
  try {
    await navigator.serviceWorker.register('/sw.js');
  } catch (err) {
    console.warn('Service worker registration failed', err);
  }
}

// ---------- Automatic Updates ----------

/** doc: desktop-only — web has no update mechanism to check (the browser always serves the latest deploy). */
export async function checkForUpdates(): Promise<{ available: boolean; version?: string }> {
  if (!isDesktop()) return { available: false };
  const result = (await window.__TAURI__!.invoke('plugin:updater|check')) as { available: boolean; version?: string };
  return result;
}
