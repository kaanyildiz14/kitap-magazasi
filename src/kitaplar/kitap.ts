import { z } from 'zod';

export interface Kitap {
  id: number;
  isim: string;
  yazar: string;
  fiyat: number;
  stok: number;
}

const kitapAlanlari = z.object({
  isim: z.string().trim().min(1, 'İsim boş olamaz'),
  yazar: z.string().trim().min(1, 'Yazar boş olamaz'),
  fiyat: z.number().nonnegative('Fiyat negatif olamaz'),
  stok: z.number().int().nonnegative('Stok negatif olamaz'),
});

export const kitapOlusturSemasi = kitapAlanlari.extend({ stok: kitapAlanlari.shape.stok.default(0) });

// Varsayılan değer içermemeli: gönderilmeyen alanlar güncellenmez
export const kitapGuncelleSemasi = kitapAlanlari.partial();

export const satisSemasi = z.object({
  adet: z.number().int().positive('Adet en az 1 olmalı').default(1),
});

export const idSemasi = z.coerce.number().int().positive();

export type KitapOlustur = z.infer<typeof kitapOlusturSemasi>;
export type KitapGuncelle = z.infer<typeof kitapGuncelleSemasi>;
