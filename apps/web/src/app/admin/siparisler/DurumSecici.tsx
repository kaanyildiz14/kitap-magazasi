'use client';

import { useState, useTransition } from 'react';
import { siparisDurumuGuncelle } from '@/actions/admin';
import { DURUM_ETIKETI, SIPARIS_DURUMLARI, SiparisDurumu } from '@/lib/tipler';

export function DurumSecici({ siparisId, durum }: { siparisId: number; durum: SiparisDurumu }) {
  const [bekliyor, baslat] = useTransition();
  const [hata, setHata] = useState<string>();
  return (
    <div>
      <label htmlFor={`durum-${siparisId}`} className="sr-only">
        Sipariş #{siparisId} durumu
      </label>
      <select
        id={`durum-${siparisId}`}
        defaultValue={durum}
        disabled={bekliyor}
        onChange={(e) => {
          const yeni = e.target.value as SiparisDurumu;
          baslat(async () => setHata((await siparisDurumuGuncelle(siparisId, yeni)).hata));
        }}
        className="rounded-md border border-cizgi bg-white px-2 py-1.5 disabled:opacity-60"
      >
        {SIPARIS_DURUMLARI.map((d) => (
          <option key={d} value={d}>
            {DURUM_ETIKETI[d]}
          </option>
        ))}
      </select>
      {hata && <p className="mt-1 text-sm text-hata">{hata}</p>}
    </div>
  );
}
