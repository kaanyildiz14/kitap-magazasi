// API'nin döndürdüğü veri biçimleri (apps/api/src/** ile aynı tutulmalı)

export type Rol = 'musteri' | 'admin';

export interface Kullanici {
  id: number;
  ad: string;
  eposta: string;
  rol: Rol;
}

export interface Kitap {
  id: number;
  isim: string;
  yazar: string;
  fiyat: number;
  stok: number;
}

export interface Sayfa<T> {
  veriler: T[];
  toplam: number;
  sayfa: number;
  limit: number;
}

export const SIPARIS_DURUMLARI = ['hazirlaniyor', 'kargoda', 'teslim_edildi', 'iptal'] as const;
export type SiparisDurumu = (typeof SIPARIS_DURUMLARI)[number];

export const DURUM_ETIKETI: Record<SiparisDurumu, string> = {
  hazirlaniyor: 'Hazırlanıyor',
  kargoda: 'Kargoda',
  teslim_edildi: 'Teslim edildi',
  iptal: 'İptal edildi',
};

export interface Siparis {
  id: number;
  kullaniciId: number;
  toplam: number;
  durum: SiparisDurumu;
  olusturulma: string;
  kalemler: { kitapId: number; kitapIsim: string; adet: number; birimFiyat: number }[];
}

/** Server Action'ların form'a döndürdüğü durum. */
export interface FormDurumu {
  hata?: string;
  alanHatalari?: Record<string, string>;
  mesaj?: string;
  /** Hata durumunda forma geri yazılan değerler (React 19 formu gönderimden sonra sıfırlar). Şifre asla dönmez. */
  degerler?: Record<string, string>;
}
