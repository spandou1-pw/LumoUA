import React from 'react';
import type { Metadata } from 'next';
import '../theme/tokens.css';
import { Providers } from './providers';

export const metadata: Metadata = {
  title: 'Lumo',
  description: 'lumo.app — одна стрічка, один месенджер, одне коло',
  manifest: '/manifest.json',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="uk">
      <body>
        {/* doc 47: skip-link, first focusable element, lets keyboard users
            bypass the sidebar nav straight to page content */}
        <a href="#main-content" className="skip-link">
          Перейти до основного вмісту
        </a>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
