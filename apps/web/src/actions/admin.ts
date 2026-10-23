'use server';

import { refresh } from 'next/cache';
import { alanHatalari, apiIstek } from '@/lib/api';
import { token } from '@/lib/oturum';
import { FormDurumu, Kitap, Siparis, SiparisDurumu } from '@/lib/tipler';

// Yetki kontrolü burada değil API'de yapılır: admin olmayan bir token'la gelen istek 403 alır.
// Arayüzdeki gizleme sadece kolaylık içindir, güvenlik sınırı API'dir.

const sayi = (deger: FormDataEntryValue | null) =>
  deger === null || deger === '' ? undefined : Number(String(deger).replace(',', '.'));

export async function kitapKaydet(_onceki: FormDurumu, form: FormData): Promise<FormDurumu> {
  const id = form.get('id');
  const govde = {
    isim: form.get('isim'),
    yazar: form.get('yazar'),
    fiyat: sayi(form.get('fiyat')),
    stok: sayi(form.get('stok')),
  };
  const sonuc = await apiIstek<Kitap>(id ? `/kitaplar/${id}` : '/kitaplar', {
    method: id ? 'PATCH' : 'POST',
    govde,
    token: await token(),
  });
  if (!sonuc.ok) {
    const degerler = Object.fromEntries(['isim', 'yazar', 'fiyat', 'stok'].map((a) => [a, String(form.get(a) ?? '')]));
    return { hata: sonuc.hata, alanHatalari: alanHatalari(sonuc.detaylar), degerler };
  }
  refresh();
  return { mesaj: id ? `"${sonuc.veri.isim}" güncellendi.` : `"${sonuc.veri.isim}" eklendi.` };
}

export async function kitapSil(id: number): Promise<FormDurumu> {
  const sonuc = await apiIstek<void>(`/kitaplar/${id}`, { method: 'DELETE', token: await token() });
  if (!sonuc.ok) return { hata: sonuc.hata };
  refresh();
  return { mesaj: 'Kitap silindi.' };
}

export async function siparisDurumuGuncelle(id: number, durum: SiparisDurumu): Promise<FormDurumu> {
  const sonuc = await apiIstek<Siparis>(`/siparisler/${id}/durum`, {
    method: 'PATCH',
    govde: { durum },
    token: await token(),
  });
  if (!sonuc.ok) return { hata: sonuc.hata };
  refresh();
  return {};
}
