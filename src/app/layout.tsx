// File: app/layout.tsx
import '@/styles/bulma.scss';   // your customized Bulma
import '@/styles/global.scss';  // your global styles

import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Minhas Finanças',
  description: 'App de controle financeiro pessoal',
  icons: {
    icon: '/logo.png', // Ensure you have this in /public
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR">
      <body>
        {children}
      </body>
    </html>
  );
}