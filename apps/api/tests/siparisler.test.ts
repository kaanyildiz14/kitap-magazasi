import request from 'supertest';
import { beforeEach, describe, expect, it } from 'vitest';
import { kalemleriBirlestir, toplamHesapla } from '../src/siparisler/siparis';
import { testOrtami } from './yardimci';

describe('yardımcı fonksiyonlar', () => {
  it('aynı kitabın adetlerini birleştirir', () => {
    expect(kalemleriBirlestir([{ kitapId: 1, adet: 1 }, { kitapId: 2, adet: 1 }, { kitapId: 1, adet: 2 }])).toEqual([
      { kitapId: 1, adet: 3 },
      { kitapId: 2, adet: 1 },
    ]);
  });

  it('toplamı kuruş hassasiyetinde hesaplar', () => {
    expect(toplamHesapla([{ birimFiyat: 0.1, adet: 1 }, { birimFiyat: 0.2, adet: 1 }])).toBe(0.3);
    expect(toplamHesapla([{ birimFiyat: 19.99, adet: 3 }])).toBe(59.97);
  });
});

describe('Sipariş API', () => {
  let o: Awaited<ReturnType<typeof testOrtami>>;
  beforeEach(async () => {
    o = await testOrtami();
    await o.repolar.kitaplar.ekle({ isim: 'Kürk Mantolu Madonna', yazar: 'Sabahattin Ali', fiyat: 145, stok: 3 });
    await o.repolar.kitaplar.ekle({ isim: 'Tutunamayanlar', yazar: 'Oğuz Atay', fiyat: 320.5, stok: 1 });
  });

  const siparisVer = (token: string, kalemler: unknown) =>
    request(o.app).post('/api/siparisler').set(o.yetki(token)).send({ kalemler });

  describe('POST /api/siparisler', () => {
    it('giriş yapmadan sipariş verilemez', async () => {
      expect((await request(o.app).post('/api/siparisler').send({ kalemler: [] })).status).toBe(401);
    });

    it('siparişi oluşturur, fiyatı veritabanından alır ve stokları düşer', async () => {
      const res = await siparisVer(o.musteriToken, [
        { kitapId: 1, adet: 2 },
        { kitapId: 2, adet: 1 },
      ]);
      expect(res.status).toBe(201);
      expect(res.headers.location).toBe('/api/siparisler/1');
      expect(res.body).toMatchObject({
        id: 1,
        kullaniciId: o.musteri.id,
        toplam: 610.5,
        durum: 'hazirlaniyor',
        kalemler: [
          { kitapId: 1, kitapIsim: 'Kürk Mantolu Madonna', adet: 2, birimFiyat: 145 },
          { kitapId: 2, kitapIsim: 'Tutunamayanlar', adet: 1, birimFiyat: 320.5 },
        ],
      });
      expect((await o.repolar.kitaplar.getir(1))?.stok).toBe(1);
      expect((await o.repolar.kitaplar.getir(2))?.stok).toBe(0);
    });

    it('istemcinin gönderdiği fiyatı yok sayar', async () => {
      const res = await siparisVer(o.musteriToken, [{ kitapId: 1, adet: 1, birimFiyat: 0.01 }]);
      expect(res.body.toplam).toBe(145);
    });

    it('bir kitabın stoğu yetersizse hiçbir stok değişmez (ya hep ya hiç)', async () => {
      const res = await siparisVer(o.musteriToken, [
        { kitapId: 1, adet: 1 },
        { kitapId: 2, adet: 5 },
      ]);
      expect(res.status).toBe(409);
      expect(res.body.hata).toContain('mevcut: 1');
      expect((await o.repolar.kitaplar.getir(1))?.stok).toBe(3);
      expect(o.veri.siparisler).toHaveLength(0);
    });

    it('aynı kitap iki kez gönderilirse toplam adet kontrol edilir', async () => {
      const res = await siparisVer(o.musteriToken, [
        { kitapId: 2, adet: 1 },
        { kitapId: 2, adet: 1 },
      ]);
      expect(res.status).toBe(409);
    });

    it('olmayan kitapta 404, boş sepette 400 döner', async () => {
      expect((await siparisVer(o.musteriToken, [{ kitapId: 99, adet: 1 }])).status).toBe(404);
      expect((await siparisVer(o.musteriToken, [])).status).toBe(400);
    });
  });

  describe('görüntüleme yetkileri', () => {
    let digerToken: string;
    beforeEach(async () => {
      await siparisVer(o.musteriToken, [{ kitapId: 1, adet: 1 }]);
      const kayit = await request(o.app)
        .post('/api/auth/kayit')
        .send({ ad: 'Can', eposta: 'can@test.com', sifre: 'can-sifresi-1' });
      digerToken = kayit.body.token;
      await siparisVer(digerToken, [{ kitapId: 1, adet: 1 }]);
    });

    it('müşteri yalnızca kendi siparişlerini listeler, admin hepsini', async () => {
      const musteri = await request(o.app).get('/api/siparisler').set(o.yetki(o.musteriToken));
      expect(musteri.body.map((s: { id: number }) => s.id)).toEqual([1]);
      const admin = await request(o.app).get('/api/siparisler').set(o.yetki(o.adminToken));
      expect(admin.body.map((s: { id: number }) => s.id)).toEqual([2, 1]);
    });

    it('başkasının siparişi 404 döner (varlığı bile söylenmez)', async () => {
      expect((await request(o.app).get('/api/siparisler/2').set(o.yetki(o.musteriToken))).status).toBe(404);
      expect((await request(o.app).get('/api/siparisler/1').set(o.yetki(o.musteriToken))).status).toBe(200);
      expect((await request(o.app).get('/api/siparisler/2').set(o.yetki(o.adminToken))).status).toBe(200);
    });

    it('durumu yalnızca admin günceller', async () => {
      const yol = '/api/siparisler/1/durum';
      expect((await request(o.app).patch(yol).set(o.yetki(o.musteriToken)).send({ durum: 'kargoda' })).status).toBe(403);
      expect((await request(o.app).patch(yol).set(o.yetki(o.adminToken)).send({ durum: 'uçuyor' })).status).toBe(400);
      const res = await request(o.app).patch(yol).set(o.yetki(o.adminToken)).send({ durum: 'kargoda' });
      expect(res.body.durum).toBe('kargoda');
    });
  });
});
