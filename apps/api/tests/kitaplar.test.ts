import request from 'supertest';
import { beforeEach, describe, expect, it } from 'vitest';
import { testOrtami } from './yardimci';

const ornekKitap = { isim: 'Kürk Mantolu Madonna', yazar: 'Sabahattin Ali', fiyat: 145, stok: 3 };

describe('Kitap API', () => {
  let o: Awaited<ReturnType<typeof testOrtami>>;
  beforeEach(async () => {
    o = await testOrtami();
  });

  it('GET /health çalışır', async () => {
    const res = await request(o.app).get('/health');
    expect(res.body).toEqual({ durum: 'ok' });
  });

  describe('GET /api/kitaplar', () => {
    beforeEach(async () => {
      for (let i = 1; i <= 25; i++) await o.repolar.kitaplar.ekle({ ...ornekKitap, isim: `Kitap ${i}` });
      await o.repolar.kitaplar.ekle({ isim: 'Tutunamayanlar', yazar: 'Oğuz Atay', fiyat: 320, stok: 1 });
    });

    it('giriş yapmadan listelenir ve varsayılan olarak 20\'li sayfalanır', async () => {
      const res = await request(o.app).get('/api/kitaplar');
      expect(res.status).toBe(200);
      expect(res.body).toMatchObject({ toplam: 26, sayfa: 1, limit: 20 });
      expect(res.body.veriler).toHaveLength(20);
    });

    it('sayfa ve limit parametrelerine uyar', async () => {
      const res = await request(o.app).get('/api/kitaplar').query({ sayfa: 3, limit: 10 });
      expect(res.body.veriler).toHaveLength(6);
    });

    it('isim veya yazara göre arar', async () => {
      const res = await request(o.app).get('/api/kitaplar').query({ arama: 'atay' });
      expect(res.body.veriler.map((k: { isim: string }) => k.isim)).toEqual(['Tutunamayanlar']);
      expect(res.body.toplam).toBe(1);
    });

    it('geçersiz limitte 400 döner', async () => {
      expect((await request(o.app).get('/api/kitaplar').query({ limit: 500 })).status).toBe(400);
    });
  });

  describe('GET /api/kitaplar/:id', () => {
    it('kitabı döner, olmayanda 404, geçersiz id\'de 400', async () => {
      await o.repolar.kitaplar.ekle(ornekKitap);
      expect((await request(o.app).get('/api/kitaplar/1')).body.isim).toBe(ornekKitap.isim);
      expect((await request(o.app).get('/api/kitaplar/99')).status).toBe(404);
      expect((await request(o.app).get('/api/kitaplar/abc')).status).toBe(400);
    });
  });

  describe('yazma işlemleri yalnızca admin', () => {
    it('girişsiz 401, müşteri 403, admin 201', async () => {
      expect((await request(o.app).post('/api/kitaplar').send(ornekKitap)).status).toBe(401);
      expect((await request(o.app).post('/api/kitaplar').set(o.yetki(o.musteriToken)).send(ornekKitap)).status).toBe(403);
      const res = await request(o.app).post('/api/kitaplar').set(o.yetki(o.adminToken)).send(ornekKitap);
      expect(res.status).toBe(201);
      expect(res.headers.location).toBe('/api/kitaplar/1');
      expect(res.body).toEqual({ id: 1, ...ornekKitap });
    });

    it('geçersiz veride alan bazlı 400 döner', async () => {
      const res = await request(o.app).post('/api/kitaplar').set(o.yetki(o.adminToken)).send({ isim: '', fiyat: -5 });
      expect(res.status).toBe(400);
      const alanlar = res.body.detaylar.map((d: { alan: string }) => d.alan);
      expect(alanlar).toEqual(expect.arrayContaining(['isim', 'yazar', 'fiyat']));
    });

    it('PATCH sadece verilen alanları günceller', async () => {
      await o.repolar.kitaplar.ekle(ornekKitap);
      const res = await request(o.app).patch('/api/kitaplar/1').set(o.yetki(o.adminToken)).send({ fiyat: 175 });
      expect(res.body).toEqual({ id: 1, ...ornekKitap, fiyat: 175 });
    });

    it('DELETE kitabı siler, ikinci seferde 404', async () => {
      await o.repolar.kitaplar.ekle(ornekKitap);
      expect((await request(o.app).delete('/api/kitaplar/1').set(o.yetki(o.adminToken))).status).toBe(204);
      expect((await request(o.app).delete('/api/kitaplar/1').set(o.yetki(o.adminToken))).status).toBe(404);
    });

    it('siparişte geçen kitap silinemez (409)', async () => {
      await o.repolar.kitaplar.ekle(ornekKitap);
      await o.repolar.siparisler.olustur(o.musteri.id, [{ kitapId: 1, adet: 1 }]);
      const res = await request(o.app).delete('/api/kitaplar/1').set(o.yetki(o.adminToken));
      expect(res.status).toBe(409);
    });
  });
});
