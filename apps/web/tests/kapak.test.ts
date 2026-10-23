import { describe, expect, it } from 'vitest';
import { cilt, CILT_RENKLERI, hash, sirtYaziBoyu } from '../src/lib/kapak';

describe('kapak', () => {
  it('aynı kitap için her zaman aynı cildi üretir', () => {
    const kitap = { id: 3, isim: 'İnce Memed' };
    expect(cilt(kitap)).toEqual(cilt({ ...kitap }));
  });

  it('ölçüler belirlenen aralıklarda kalır', () => {
    for (let id = 1; id <= 200; id++) {
      const c = cilt({ id, isim: `Kitap ${id}` });
      expect(c.kalinlik).toBeGreaterThanOrEqual(38);
      expect(c.kalinlik).toBeLessThan(64);
      expect(c.boy).toBeGreaterThanOrEqual(210);
      expect(c.boy).toBeLessThan(280);
    }
  });

  it('farklı kitaplar renk paletinin tamamına dağılır', () => {
    const renkler = new Set(Array.from({ length: 200 }, (_, i) => cilt({ id: i, isim: `K${i}` }).zemin));
    expect(renkler.size).toBe(CILT_RENKLERI.length);
  });

  it('Türkçe karakterlerde de kararlı çalışır', () => {
    expect(hash('Çalıkuşu')).toBe(hash('Çalıkuşu'));
    expect(hash('Çalıkuşu')).not.toBe(hash('Calikusu'));
  });
});

describe('sirtYaziBoyu', () => {
  it('kısa isimlerde 15px, uzun isimlerde küçülür ama 10px altına inmez', () => {
    expect(sirtYaziBoyu('Yaban', 230)).toBe(15);
    const uzun = sirtYaziBoyu('Saatleri Ayarlama Enstitüsü', 230);
    expect(uzun).toBeLessThan(15);
    expect(uzun).toBeGreaterThanOrEqual(10);
    expect(sirtYaziBoyu('Çok '.repeat(30), 230)).toBe(10);
  });
});
