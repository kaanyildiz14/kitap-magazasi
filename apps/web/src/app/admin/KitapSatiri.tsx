'use client';

import { useState, useTransition } from 'react';
import { kitapSil } from '@/actions/admin';
import { fiyat } from '@/lib/bicim';
import { Kitap } from '@/lib/tipler';
import { KitapFormu } from './KitapFormu';

export function KitapSatiri({ kitap }: { kitap: Kitap }) {
  const [duzenleniyor, setDuzenleniyor] = useState(false);
  const [silOnayi, setSilOnayi] = useState(false);
  const [hata, setHata] = useState<string>();
  const [bekliyor, baslat] = useTransition();

  if (duzenleniyor) {
    return (
      <tr>
        <td colSpan={5} className="bg-white/50 px-3 py-5">
          <KitapFormu kitap={kitap} onKaydedildi={() => setDuzenleniyor(false)} />
        </td>
      </tr>
    );
  }

  return (
    <tr className="align-top">
      <td className="py-3 pr-3">
        <p className="font-serif font-semibold">{kitap.isim}</p>
        {hata && (
          <p role="alert" className="mt-1 text-sm text-hata">
            {hata}
          </p>
        )}
      </td>
      <td className="py-3 pr-3 text-murekkep-soluk">{kitap.yazar}</td>
      <td className="py-3 pr-3 text-right tabular-nums">{fiyat(kitap.fiyat)}</td>
      <td className={`py-3 pr-3 text-right tabular-nums ${kitap.stok === 0 ? 'font-bold text-hata' : ''}`}>{kitap.stok}</td>
      <td className="py-3 text-right whitespace-nowrap">
        {silOnayi ? (
          <span className="inline-flex gap-3">
            <button
              type="button"
              disabled={bekliyor}
              onClick={() =>
                baslat(async () => {
                  const sonuc = await kitapSil(kitap.id);
                  setSilOnayi(false);
                  setHata(sonuc.hata);
                })
              }
              className="font-bold text-hata underline underline-offset-4"
            >
              {bekliyor ? 'Siliniyor…' : 'Evet, sil'}
            </button>
            <button type="button" onClick={() => setSilOnayi(false)} className="underline underline-offset-4">
              Vazgeç
            </button>
          </span>
        ) : (
          <span className="inline-flex gap-3">
            <button type="button" onClick={() => setDuzenleniyor(true)} className="underline underline-offset-4">
              Düzenle
            </button>
            <button
              type="button"
              onClick={() => {
                setHata(undefined);
                setSilOnayi(true);
              }}
              className="text-murekkep-soluk underline underline-offset-4 hover:text-hata"
            >
              Sil
            </button>
          </span>
        )}
      </td>
    </tr>
  );
}
