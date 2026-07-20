/**
 * @jest-environment jsdom
 */
import { isDesktop, checkForUpdates, registerGlobalShortcut } from '../src/native/bridge';

describe('native bridge — web (non-Tauri) environment', () => {
  beforeEach(() => {
    // jsdom has no window.__TAURI__ by default — this suite verifies the
    // fallback paths doc WEB_DESKTOP.md requires (real behavior, not a
    // silent no-op) actually engage when running as plain web.
    delete (window as any).__TAURI__;
  });

  it('isDesktop() is false in a plain browser environment', () => {
    expect(isDesktop()).toBe(false);
  });

  it('checkForUpdates() returns unavailable on web — there is no update mechanism for a browser tab', async () => {
    const result = await checkForUpdates();
    expect(result).toEqual({ available: false });
  });

  it('registerGlobalShortcut() is a documented no-op on web, not a fake success', async () => {
    const handler = jest.fn();
    await registerGlobalShortcut('CmdOrCtrl+Shift+E', handler);
    // No error thrown, no Tauri invoke attempted, handler not (yet) called —
    // this is the correct behavior, not a bug: browsers cannot register
    // OS-level global shortcuts.
    expect(handler).not.toHaveBeenCalled();
  });
});

describe('native bridge — inside Tauri', () => {
  it('isDesktop() is true when window.__TAURI__ is present', () => {
    (window as any).__TAURI__ = { invoke: jest.fn() };
    expect(isDesktop()).toBe(true);
    delete (window as any).__TAURI__;
  });

  it('checkForUpdates() calls the Tauri updater plugin via invoke', async () => {
    const invoke = jest.fn().mockResolvedValue({ available: true, version: '0.2.0' });
    (window as any).__TAURI__ = { invoke };

    const result = await checkForUpdates();

    expect(invoke).toHaveBeenCalledWith('plugin:updater|check');
    expect(result).toEqual({ available: true, version: '0.2.0' });
    delete (window as any).__TAURI__;
  });
});
