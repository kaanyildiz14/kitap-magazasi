import { z } from 'zod';

export const DURUMLAR = ['hazirlaniyor', 'kargoda', 'teslim_edildi', 'iptal'] as const;
export type SiparisDurumu = (typeof DURUMLAR)[number];

export interface SiparisKalemi {
  kitapId: number;
  kitapIsim: string;
  adet: number;
  birimFiyat: number;
}

export interface Siparis {
  id: number;
  kullaniciId: number;
  toplam: number;
  durum: SiparisDurumu;
  olusturulma: string;
  kalemler: SiparisKalemi[];
}

export interface IstenenKalem {
  kitapId: number;
  adet: number;
}

/** Sipariş oluşturmanın olası sonuçları; hata durumları istisna değil, normal birer sonuçtur. */
export type SiparisSonucu =
  | { tur: 'tamam'; siparis: Siparis }
  | { tur: 'kitap_yok'; kitapId: number }
  | { tur: 'yetersiz_stok'; kitapId: number; mevcut: number };

// İstemci yalnızca kitap ve adet gönderir; fiyat her zaman veritabanından okunur
export const siparisOlusturSemasi = z.object({
  kalemler: z
    .array(
      z.object({
        kitapId: z.number().int().positive(),
        adet: z.number().int().min(1, 'Adet en az 1 olmalı').max(100),
      }),
    )
    .min(1, 'Sipariş en az bir kitap içermeli')
    .max(50),
});

export const durumGuncelleSemasi = z.object({ durum: z.enum(DURUMLAR) });

/** Aynı kitap birden çok kez gönderildiyse adetlerini toplar. */
export function kalemleriBirlestir(kalemler: IstenenKalem[]): IstenenKalem[] {
  const toplamlar = new Map<number, number>();
  for (const { kitapId, adet } of kalemler) toplamlar.set(kitapId, (toplamlar.get(kitapId) ?? 0) + adet);
  return [...toplamlar].map(([kitapId, adet]) => ({ kitapId, adet }));
}

/** Kuruş cinsinden hesaplar: 0.1 + 0.2 gibi ondalık yuvarlama hatalarını önler. */
export function toplamHesapla(kalemler: { birimFiyat: number; adet: number }[]): number {
  const kurus = kalemler.reduce((t, k) => t + Math.round(k.birimFiyat * 100) * k.adet, 0);
  return kurus / 100;
}
