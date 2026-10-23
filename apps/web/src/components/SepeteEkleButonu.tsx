'use client';

import { useState } from 'react';
import { Kitap } from '@/lib/tipler';
import { useSepet } from './SepetProvider';

export function SepeteEkleButonu({ kitap }: { kitap: Kitap }) {
  const { ekle, sepet } = useSepet();
  const [eklendi, setEklendi] = useState(false);
  const sepetteki = sepet.find((k) => k.kitapId === kitap.id)?.adet ?? 0;
  const stokDoldu = sepetteki >= kitap.stok;

  if (kitap.stok === 0) {
    return <p className="font-semibold text-murekkep-soluk">Bu kitap şu an stokta yok.</p>;
  }

  return (
    <div className="flex flex-wrap items-center gap-4">
      <button
        type="button"
        disabled={stokDoldu}
        onClick={() => {
          ekle({ kitapId: kitap.id, isim: kitap.isim, yazar: kitap.yazar, fiyat: kitap.fiyat, stok: kitap.stok });
          setEklendi(true);
        }}
        className="rounded-full bg-eylem px-6 py-3 font-bold text-white hover:bg-eylem-koyu disabled:cursor-not-allowed disabled:bg-cizgi disabled:text-murekkep-soluk"
      >
        Sepete ekle
      </button>
      <p aria-live="polite" className="text-sm text-murekkep-soluk">
        {stokDoldu
          ? `Stoktaki ${kitap.stok} kitabın hepsi sepetinizde.`
          : eklendi && sepetteki > 0
            ? `Sepetinizde ${sepetteki} adet var.`
            : `Stokta ${kitap.stok} adet`}
      </p>
    </div>
  );
}
