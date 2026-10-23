const tl = new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY' });
const tarih = new Intl.DateTimeFormat('tr-TR', { dateStyle: 'long', timeStyle: 'short', timeZone: 'Europe/Istanbul' });

export const fiyat = (deger: number) => tl.format(deger);
export const tarihSaat = (iso: string) => tarih.format(new Date(iso));
