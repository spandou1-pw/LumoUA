/** @type {import('next').NextConfig} */
const nextConfig = {
  // doc 19: the authenticated app is a CSR SPA (no SSR benefit for
  // login-gated content) — static export produces one build artifact
  // consumed identically by web hosting (PWA) and the Tauri desktop shell
  // (which loads these files locally, never a remote URL — see doc
  // WEB_DESKTOP.md "do not wrap the website").
  output: 'export',
  images: { unoptimized: true }, // static export can't use the Next.js image optimization server
  trailingSlash: true,
};

module.exports = nextConfig;
