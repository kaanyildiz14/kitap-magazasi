import type { Metadata } from 'next';
import { Atkinson_Hyperlegible, Literata } from 'next/font/google';
import { Suspense } from 'react';
import { AramaKutusu } from '@/components/AramaKutusu';
import { KullaniciMenusu } from '@/components/KullaniciMenusu';
import { SepetProvider } from '@/components/SepetProvider';
import { SepetSayaci } from '@/components/SepetSayaci';
import Link from 'next/link';
import './globals.css';

const literata = Literata({ subsets: ['latin', 'latin-ext'], variable: '--font-literata', display: 'swap' });
const atkinson = Atkinson_Hyperlegible({
  subsets: ['latin', 'latin-ext'],
  weight: ['400', '700'],
  variable: '--font-atkinson',
  display: 'swap',
});

export const metadata: Metadata = {
  title: { default: 'Raf · Kitap Mağazası', template: '%s · Raf' },
  description: 'Türk edebiyatının klasikleri ve daha fazlası. Raf, bağımsız bir kitap mağazası.',
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="tr" className={`${literata.variable} ${atkinson.variable}`}>
      <body className="min-h-dvh flex flex-col">
        <SepetProvider>
          <header className="border-b border-cizgi">
            <div className="mx-auto max-w-6xl px-4 sm:px-6 py-4 flex flex-wrap items-center gap-x-6 gap-y-3">
              <Link href="/" className="font-serif text-3xl font-semibold tracking-tight">
                Raf
              </Link>
              <Suspense fallback={<div className="order-3 w-full sm:order-none sm:w-auto sm:flex-1" />}>
                <AramaKutusu />
              </Suspense>
              <nav className="ml-auto flex items-center gap-5 text-sm" aria-label="Hesap">
                <Suspense fallback={<span className="text-murekkep-soluk">…</span>}>
                  <KullaniciMenusu />
                </Suspense>
                <SepetSayaci />
              </nav>
            </div>
          </header>
          <main className="flex-1">{children}</main>
          <footer className="border-t border-cizgi text-sm text-murekkep-soluk">
            <div className="mx-auto max-w-6xl px-4 sm:px-6 py-6 flex flex-wrap justify-between gap-2">
              <p>Raf, bir portföy projesidir. Siparişler gerçek değildir.</p>
              <a className="underline underline-offset-4 hover:text-murekkep" href="https://github.com/kaanyildiz14/kitap-magazasi">
                Kaynak kodu
              </a>
            </div>
          </footer>
        </SepetProvider>
      </body>
    </html>
  );
}
