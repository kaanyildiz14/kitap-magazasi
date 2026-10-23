import request from 'supertest';
import { beforeEach, describe, expect, it } from 'vitest';
import { createApp } from '../src/app';
import { BellekKitapRepository } from './bellekKitapRepository';

const ornekKitap = { isim: 'Kürk Mantolu Madonna', yazar: 'Sabahattin Ali', fiyat: 145, stok: 3 };

describe('Kitap API', () => {
  let repo: BellekKitapRepository;
  let app: ReturnType<typeof createApp>;

  beforeEach(() => {
    repo = new BellekKitapRepository();
    app = createApp(repo);
  });

  it('GET /health çalışır', async () => {
    const res = await request(app).get('/health');
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ durum: 'ok' });
  });

  describe('POST /api/kitaplar', () => {
    it('yeni kitap oluşturur', async () => {
      const res = await request(app).post('/api/kitaplar').send(ornekKitap);
      expect(res.status).toBe(201);
      expect(res.headers.location).toBe('/api/kitaplar/1');
      expect(res.body).toEqual({ id: 1, ...ornekKitap });
    });

    it('geçersiz veride 400 ve alan detayları döner', async () => {
      const res = await request(app).post('/api/kitaplar').send({ isim: '', fiyat: -5 });
      expect(res.status).toBe(400);
      const alanlar = res.body.detaylar.map((d: { alan: string }) => d.alan);
      expect(alanlar).toEqual(expect.arrayContaining(['isim', 'yazar', 'fiyat']));
    });
  });

  describe('GET /api/kitaplar', () => {
    it('tüm kitapları listeler', async () => {
      await repo.ekle(ornekKitap);
      await repo.ekle({ isim: 'Tutunamayanlar', yazar: 'Oğuz Atay', fiyat: 320, stok: 1 });
      const res = await request(app).get('/api/kitaplar');
      expect(res.status).toBe(200);
      expect(res.body).toHaveLength(2);
    });

    it('isim veya yazara göre arar', async () => {
      await repo.ekle(ornekKitap);
      await repo.ekle({ isim: 'Tutunamayanlar', yazar: 'Oğuz Atay', fiyat: 320, stok: 1 });
      const res = await request(app).get('/api/kitaplar').query({ arama: 'atay' });
      expect(res.body.map((k: { isim: string }) => k.isim)).toEqual(['Tutunamayanlar']);
    });
  });

  describe('GET /api/kitaplar/:id', () => {
    it('kitabı döner', async () => {
      await repo.ekle(ornekKitap);
      const res = await request(app).get('/api/kitaplar/1');
      expect(res.body.isim).toBe(ornekKitap.isim);
    });

    it('olmayan kitapta 404 döner', async () => {
      const res = await request(app).get('/api/kitaplar/99');
      expect(res.status).toBe(404);
    });

    it('geçersiz id de 400 döner', async () => {
      const res = await request(app).get('/api/kitaplar/abc');
      expect(res.status).toBe(400);
    });
  });

  it('PATCH /api/kitaplar/:id sadece verilen alanları günceller', async () => {
    await repo.ekle(ornekKitap);
    const res = await request(app).patch('/api/kitaplar/1').send({ fiyat: 175 });
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ id: 1, ...ornekKitap, fiyat: 175 });
  });

  it('DELETE /api/kitaplar/:id kitabı siler', async () => {
    await repo.ekle(ornekKitap);
    expect((await request(app).delete('/api/kitaplar/1')).status).toBe(204);
    expect((await request(app).delete('/api/kitaplar/1')).status).toBe(404);
  });

  describe('POST /api/kitaplar/:id/satis', () => {
    it('varsayılan olarak 1 adet satar ve stoğu düşer', async () => {
      await repo.ekle(ornekKitap);
      const res = await request(app).post('/api/kitaplar/1/satis');
      expect(res.status).toBe(200);
      expect(res.body.stok).toBe(2);
    });

    it('istenen adet kadar satar', async () => {
      await repo.ekle(ornekKitap);
      const res = await request(app).post('/api/kitaplar/1/satis').send({ adet: 3 });
      expect(res.body.stok).toBe(0);
    });

    it('stok yetersizse 409 döner ve stoğa dokunmaz', async () => {
      await repo.ekle(ornekKitap);
      const res = await request(app).post('/api/kitaplar/1/satis').send({ adet: 5 });
      expect(res.status).toBe(409);
      expect((await repo.getir(1))?.stok).toBe(3);
    });

    it('olmayan kitapta 404 döner', async () => {
      const res = await request(app).post('/api/kitaplar/7/satis');
      expect(res.status).toBe(404);
    });
  });
});
