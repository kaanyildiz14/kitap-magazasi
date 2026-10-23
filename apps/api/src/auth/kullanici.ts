import { z } from 'zod';

export const ROLLER = ['musteri', 'admin'] as const;
export type Rol = (typeof ROLLER)[number];

/** API'nin dışarı verdiği kullanıcı: şifre hash'i asla bu tipte yer almaz. */
export interface Kullanici {
  id: number;
  ad: string;
  eposta: string;
  rol: Rol;
}

/** Yalnızca repository ve giriş kontrolü içinde dolaşan, hash'li kayıt. */
export interface KullaniciKaydi extends Kullanici {
  sifreHash: string;
}

const eposta = z
  .string()
  .trim()
  .toLowerCase()
  .pipe(z.email('Geçerli bir e-posta girin'));

export const kayitSemasi = z.object({
  ad: z.string().trim().min(2, 'Ad en az 2 karakter olmalı').max(100),
  eposta,
  sifre: z.string().min(8, 'Şifre en az 8 karakter olmalı').max(128),
});

export const girisSemasi = z.object({
  eposta,
  sifre: z.string().min(1, 'Şifre gerekli'),
});

export function disariVer({ id, ad, eposta, rol }: Kullanici): Kullanici {
  return { id, ad, eposta, rol };
}
