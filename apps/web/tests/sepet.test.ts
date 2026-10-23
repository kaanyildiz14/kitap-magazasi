import { describe, expect, it } from 'vitest';
import { adetDegistir, sepetiOku, sepeteEkle, sepetToplami, sepettenCikar, urunSayisi } from '../src/lib/sepet';

const madonna = { kitapId: 1, isim: 'Kürk Mantolu Madonna', yazar: 'Sabahattin Ali', fiyat: 145, stok: 3 };
const atay = { kitapId: 2, isim: 'Tutunamayanlar', yazar: 'Oğuz Atay', fiyat: 320.5, stok: 10 };

describe('sepet', () => {
  it('yeni kitabı ekler, aynı kitabı tekrar eklerse adedi artırır', () => {
    let sepet = sepeteEkle([], madonna);
    sepet = sepeteEkle(sepet, madonna);
    expect(sepet).toEqual([{ ...madonna, adet: 2 }]);
  });

  it('stoktan fazla eklenemez', () => {
    const sepet = sepeteEkle([], madonna, 10);
    expect(sepet[0].adet).toBe(3);
    expect(adetDegistir(sepet, 1, 50)[0].adet).toBe(3);
  });

  it('adet 0 yapılınca kitap sepetten çıkar', () => {
    expect(adetDegistir(sepeteEkle([], madonna), 1, 0)).toEqual([]);
  });

  it('kitabı sepetten çıkarır', () => {
    const sepet = sepeteEkle(sepeteEkle([], madonna), atay);
    expect(sepettenCikar(sepet, 1).map((k) => k.kitapId)).toEqual([2]);
  });

  it('toplamı ve ürün sayısını kuruş hassasiyetinde hesaplar', () => {
    const sepet = sepeteEkle(sepeteEkle([], madonna, 2), atay);
    expect(sepetToplami(sepet)).toBe(610.5);
    expect(urunSayisi(sepet)).toBe(3);
    expect(sepetToplami([{ ...madonna, fiyat: 0.1, adet: 1 }, { ...atay, fiyat: 0.2, adet: 1 }])).toBe(0.3);
  });

  it('localStorage\'daki bozuk veriyi yok sayar', () => {
    expect(sepetiOku(null)).toEqual([]);
    expect(sepetiOku('{bozuk')).toEqual([]);
    expect(sepetiOku('{"a":1}')).toEqual([]);
    const karisik = JSON.stringify([{ ...madonna, adet: 1 }, { kitapId: 'x' }, { ...atay, adet: -2 }]);
    expect(sepetiOku(karisik)).toEqual([{ ...madonna, adet: 1 }]);
  });
});
