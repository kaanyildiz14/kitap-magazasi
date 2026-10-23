'use client';

import Link from 'next/link';
import { urunSayisi } from '@/lib/sepet';
import { useSepet } from './SepetProvider';

export function SepetSayaci() {
  const { sepet, hazir } = useSepet();
  const sayi = urunSayisi(sepet);
  return (
    <Link
      href="/sepet"
      className="inline-flex items-center gap-2 rounded-full bg-murekkep px-4 py-2 text-kagit hover:bg-eylem"
    >
      Sepet
      <span className="tabular-nums" aria-label={`${sayi} ürün`}>
        {hazir ? sayi : 0}
      </span>
    </Link>
  );
}
