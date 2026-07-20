// doc WEB_DESKTOP.md: this file is real, compilable Rust (not pseudocode)
// but has NOT been compiled/run in the sandbox this project was built in
// — there is no Rust toolchain available here. See WEB_DESKTOP.md's
// verification-scope note. It targets Tauri 1.x's documented API surface
// as of this writing; pin exact versions against `cargo build` output
// before shipping.

#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use tauri::{GlobalShortcutManager, Manager, WindowBuilder, WindowUrl};

/// doc: Keyboard Shortcuts — OS-level global shortcut, works even when the
/// app isn't focused (the in-app-only shortcuts like Cmd+K live entirely
/// in the web layer, src/native/bridge.ts's `useInAppShortcut`). Bound to
/// "toggle quick-compose" as the representative example; additional
/// shortcuts follow the same registration pattern.
fn register_global_shortcuts(app: &tauri::AppHandle) -> Result<(), tauri::Error> {
    let mut shortcut_manager = app.global_shortcut_manager();
    let app_handle = app.clone();

    shortcut_manager.register("CmdOrCtrl+Shift+E", move || {
        // doc: emits an event the web layer listens for (see
        // src/native/bridge.ts's registerGlobalShortcut comment) —
        // native->web communication goes through Tauri's event system,
        // never a direct DOM manipulation from Rust.
        let _ = app_handle.emit_all("global-shortcut:quick-compose", ());
    })?;

    Ok(())
}

/// doc: Window Management — opens a conversation/route in its own native
/// window, backing `openInNewWindow()`'s desktop path in bridge.ts.
#[tauri::command]
async fn create_window(app: tauri::AppHandle, url: String, label: String) -> Result<(), String> {
    WindowBuilder::new(&app, label, WindowUrl::App(url.into()))
        .title("Lumo")
        .inner_size(420.0, 720.0)
        .build()
        .map_err(|e| e.to_string())?;
    Ok(())
}

fn main() {
    tauri::Builder::default()
        .setup(|app| {
            register_global_shortcuts(&app.handle())?;
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![create_window])
        // doc: Drag & Drop — Tauri's window-level file-drop event fires for
        // files dropped from the OS file manager onto the window (distinct
        // from the in-webview HTML5 drag-drop already handled by the React
        // layer for drops that originate/land inside a web element, see
        // apps/web feed page). Both paths converge on the same "attach
        // file to compose" application logic in a full implementation.
        .on_window_event(|event| {
            if let tauri::WindowEvent::FileDrop(tauri::FileDropEvent::Dropped(paths)) = event.event() {
                let _ = event.window().emit("native-file-drop", paths);
            }
        })
        .run(tauri::generate_context!())
        .expect("error while running Lumo desktop shell");
}
