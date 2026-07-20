// doc LUMO.md: `rm -rf`/`cp -r` don't exist on Windows' default shell —
// and the desktop build CI runs on windows-latest too (see
// .github/workflows/build-desktop.yml). A plain Node script using `fs`
// works identically on every platform without adding a cross-platform-
// shell-commands dependency for one two-line job.
const fs = require('fs');
const path = require('path');

const dest = path.join(__dirname, '..', '..', 'desktop', 'dist-web');
const src = path.join(__dirname, '..', 'out');

fs.rmSync(dest, { recursive: true, force: true });
fs.cpSync(src, dest, { recursive: true });

console.log(`Copied ${src} -> ${dest}`);
