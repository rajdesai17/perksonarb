'use client';

import '@rainbow-me/rainbowkit/styles.css';
import './globals.css';
import { WalletProvider } from '../components/WalletProvider';

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <WalletProvider>
          {children}
        </WalletProvider>
      </body>
    </html>
  );
}
