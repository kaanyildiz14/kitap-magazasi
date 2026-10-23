'use server';

import { refresh } from 'next/cache';
import { apiIstek } from '@/lib/api';
import { token } from '@/lib/oturum';
import { Siparis } from '@/lib/tipler';

export type SiparisSonucu = { siparisId: number } | { hata: string; girisGerekli?: boolean };

/** Sepetten yalnızca kitap ve adet gönderilir; fiyatı ve stoğu API kendi veritabanından kontrol eder. */
export async function siparisVer(kalemler: { kitapId: number; adet: number }[]): Promise<SiparisSonucu> {
  const t = await token();
  if (!t) return { hata: 'Sipariş vermek için giriş yapın.', girisGerekli: true };

  const sonuc = await apiIstek<Siparis>('/siparisler', { method: 'POST', govde: { kalemler }, token: t });
  if (!sonuc.ok) {
    return { hata: sonuc.hata, girisGerekli: sonuc.durum === 401 };
  }
  refresh();
  return { siparisId: sonuc.veri.id };
}
