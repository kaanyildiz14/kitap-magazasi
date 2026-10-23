// Sepet mantığı saf fonksiyonlardan oluşur: React'ten bağımsız, kolayca test edilir.

export interface SepetKalemi {
  kitapId: number;
  isim: string;
  yazar: string;
  fiyat: number;
  adet: number;
  /** Eklendiği andaki stok; sepette bundan fazlası seçilemez. Asıl kontrolü sipariş anında API yapar. */
  stok: number;
}

export const ADET_SINIRI = 100;

export function sepeteEkle(sepet: SepetKalemi[], kitap: Omit<SepetKalemi, 'adet'>, adet = 1): SepetKalemi[] {
  const mevcut = sepet.find((k) => k.kitapId === kitap.kitapId);
  if (!mevcut) return [...sepet, { ...kitap, adet: sinirla(adet, kitap.stok) }];
  return sepet.map((k) => (k.kitapId === kitap.kitapId ? { ...k, ...kitap, adet: sinirla(k.adet + adet, kitap.stok) } : k));
}

export function adetDegistir(sepet: SepetKalemi[], kitapId: number, adet: number): SepetKalemi[] {
  if (adet <= 0) return sepettenCikar(sepet, kitapId);
  return sepet.map((k) => (k.kitapId === kitapId ? { ...k, adet: sinirla(adet, k.stok) } : k));
}

export function sepettenCikar(sepet: SepetKalemi[], kitapId: number): SepetKalemi[] {
  return sepet.filter((k) => k.kitapId !== kitapId);
}

/** Kuruş cinsinden toplar (API'deki hesapla aynı): 0.1 + 0.2 = 0.3 */
export function sepetToplami(sepet: SepetKalemi[]): number {
  return sepet.reduce((t, k) => t + Math.round(k.fiyat * 100) * k.adet, 0) / 100;
}

export function urunSayisi(sepet: SepetKalemi[]): number {
  return sepet.reduce((t, k) => t + k.adet, 0);
}

/** localStorage'dan gelen veriye güvenilmez: bozuk ya da elle değiştirilmiş kayıtlar atılır. */
export function sepetiOku(ham: string | null): SepetKalemi[] {
  try {
    const veri: unknown = JSON.parse(ham ?? '[]');
    if (!Array.isArray(veri)) return [];
    return veri.filter(
      (k): k is SepetKalemi =>
        typeof k === 'object' &&
        k !== null &&
        Number.isInteger(k.kitapId) &&
        typeof k.isim === 'string' &&
        typeof k.yazar === 'string' &&
        typeof k.fiyat === 'number' &&
        Number.isInteger(k.adet) &&
        k.adet > 0 &&
        Number.isInteger(k.stok),
    );
  } catch {
    return [];
  }
}

function sinirla(adet: number, stok: number) {
  return Math.max(1, Math.min(adet, stok, ADET_SINIRI));
}
