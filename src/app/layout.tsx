import '@/styles/bulma.scss';
import '@/styles/global.scss';

import type { Metadata } from 'next';
import { UserProvider } from '@/context/userContext';

export const metadata: Metadata = {
  title: 'Minhas Finanças',
  description: 'App de controle financeiro pessoal',
  icons: {
    icon: '/logo.png',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body>
        <UserProvider>
          {children}
        </UserProvider>
      </body>
    </html>
  );
}
