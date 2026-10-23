// Kitap görseli olmadığı için her kitaba isminden türetilen, her seferinde aynı çıkan bir "cilt" verilir:
// renk, sırt kalınlığı ve boy. Aynı kitap her yerde aynı görünür, kitaplar birbirinden ayırt edilir.

export const CILT_RENKLERI = [
  { zemin: '#2F6B5A', yazi: '#F1F5EF' }, // şişe yeşili
  { zemin: '#7A2E2E', yazi: '#F6ECE4' }, // koyu kırmızı
  { zemin: '#2E4A7A', yazi: '#EEF2F8' }, // kobalt
  { zemin: '#B9852A', yazi: '#1C2B33' }, // hardal
  { zemin: '#4F3D6B', yazi: '#F1ECF6' }, // mürdüm
  { zemin: '#3B463A', yazi: '#E9EEE4' }, // zeytin
  { zemin: '#D8D2C2', yazi: '#1C2B33' }, // bez cilt
  { zemin: '#1C2B33', yazi: '#E4E9E6' }, // mürekkep
] as const;

/** FNV-1a: kısa, hızlı ve her ortamda aynı sonucu veren bir metin hash'i. */
export function hash(metin: string): number {
  let h = 0x811c9dc5;
  for (const karakter of metin) {
    h ^= karakter.codePointAt(0)!;
    h = Math.imul(h, 0x01000193);
  }
  // FNV'nin düşük bitleri zayıf dağılır (% 8 hep aynı birkaç rengi verir); MurmurHash3'ün
  // son karıştırma adımı bitleri iyice harmanlar.
  h ^= h >>> 16;
  h = Math.imul(h, 0x85ebca6b);
  h ^= h >>> 13;
  h = Math.imul(h, 0xc2b2ae35);
  h ^= h >>> 16;
  return h >>> 0;
}

export interface Cilt {
  zemin: string;
  yazi: string;
  /** Raftaki sırt kalınlığı (px) */
  kalinlik: number;
  /** Raftaki boy (px) */
  boy: number;
  /** Sırttaki süs bandının konumu (yüzde) */
  bant: number;
}

export function cilt(kitap: { id: number; isim: string }): Cilt {
  const h = hash(`${kitap.id}:${kitap.isim}`);
  const renk = CILT_RENKLERI[h % CILT_RENKLERI.length];
  return {
    ...renk,
    kalinlik: 38 + ((h >>> 3) % 26),
    boy: 210 + ((h >>> 9) % 70),
    bant: 12 + ((h >>> 15) % 18),
  };
}

/**
 * Kitap adı sırta sığacak şekilde yazı boyu (px). Ad kısaysa 15px, uzadıkça küçülür, 10px'in altına inmez.
 * Sırtın yaklaşık %62'si başlığa ayrılır (kalan kısım süs çizgisi ve yazar soyadı için).
 */
export function sirtYaziBoyu(isim: string, boy: number): number {
  const karakterGenisligi = 0.56; // Literata'da ortalama harf genişliği / yazı boyu
  const sigan = (boy * 0.62) / ([...isim].length * karakterGenisligi);
  return Math.round(Math.max(10, Math.min(15, sigan)) * 10) / 10;
}
