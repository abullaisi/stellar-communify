import type { Metadata } from 'next';
import { Inter, Playfair_Display } from 'next/font/google';
import { AppHeader } from '@/components/app-header';
import { TooltipProvider } from '@/components/ui/tooltip';
import { QueryProvider } from '@/providers/query-provider';
import { WalletProvider } from '@/providers/wallet-provider';
import './globals.css';

const inter = Inter({ subsets: ['latin'] });
const playfair = Playfair_Display({ subsets: ['latin'], variable: '--font-serif' });

export const metadata: Metadata = {
  title: 'komunify',
  description: 'Generated with create-monorepo',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={playfair.variable}>
      <body className={inter.className}>
        <QueryProvider>
          <WalletProvider>
            <TooltipProvider delayDuration={150}>
              <AppHeader />
              {children}
            </TooltipProvider>
          </WalletProvider>
        </QueryProvider>
      </body>
    </html>
  );
}
