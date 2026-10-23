// Gerçek PostgreSQL'e karşı çalışan testler: SQL sorgularını, transaction'ları ve satır kilitlerini doğrular.
// Yalnızca TEST_DATABASE_URL tanımlıysa çalışır (CI'da tanımlı). DİKKAT: o veritabanındaki her şeyi siler.
//   createdb kitap_test && TEST_DATABASE_URL=postgres://localhost/kitap_test npm test -w apps/api
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { Pool } from 'pg';
import request from 'supertest';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { createApp } from '../../src/app';
import { PgKullaniciRepository } from '../../src/auth/kullaniciRepository';
import { sifreHashle } from '../../src/auth/sifre';
import { TokenServisi } from '../../src/auth/token';
import { PgKitapRepository } from '../../src/kitaplar/kitapRepository';
import { PgSiparisRepository } from '../../src/siparisler/siparisRepository';
import { TEST_ANAHTARI } from '../yardimci';

const url = process.env.TEST_DATABASE_URL;

describe.skipIf(!url)('PostgreSQL entegrasyonu', () => {
  const pool = new Pool({ connectionString: url, max: 20 });
  const tokenlar = new TokenServisi(TEST_ANAHTARI);
  const repolar = {
    kitaplar: new PgKitapRepository(pool),
    kullanicilar: new PgKullaniciRepository(pool),
    siparisler: new PgSiparisRepository(pool),
  };
  const app = createApp({ ...repolar, tokenlar, authLimiti: 1000 });
  const yetki = (token: string) => ({ Authorization: `Bearer ${token}` });
  let adminToken: string;
  let musteriToken: string;

  beforeAll(async () => {
    await pool.query('DROP SCHEMA public CASCADE; CREATE SCHEMA public;');
    await pool.query(readFileSync(join(__dirname, '../../../../db/schema.sql'), 'utf8'));
  });

  beforeEach(async () => {
    await pool.query('TRUNCATE kullanicilar, kitaplar, siparisler, siparis_kalemleri RESTART IDENTITY CASCADE');
    const admin = await repolar.kullanicilar.ekle({
      ad: 'Admin',
      eposta: 'admin@test.com',
      sifreHash: await sifreHashle('admin-sifresi'),
      rol: 'admin',
    });
    adminToken = await tokenlar.imzala({ kullaniciId: admin!.id, rol: 'admin' });
    const kayit = await request(app)
      .post('/api/auth/kayit')
      .send({ ad: 'Ayşe', eposta: 'ayse@test.com', sifre: 'guclu-sifre-1' });
    musteriToken = kayit.body.token;
  });

  afterAll(async () => {
    await pool.end();
  });

  const kitapEkle = async (isim: string, fiyat: number, stok: number) =>
    (await request(app).post('/api/kitaplar').set(yetki(adminToken)).send({ isim, yazar: 'Yazar', fiyat, stok })).body
      .id as number;
  const stok = async (id: number) => (await repolar.kitaplar.getir(id))!.stok;

  it('kayıt → giriş → sipariş → listeleme akışı uçtan uca çalışır', async () => {
    const id = await kitapEkle('Kürk Mantolu Madonna', 145.5, 3);
    const giris = await request(app).post('/api/auth/giris').send({ eposta: 'AYSE@test.com', sifre: 'guclu-sifre-1' });
    expect(giris.status).toBe(200);

    const siparis = await request(app)
      .post('/api/siparisler')
      .set(yetki(giris.body.token))
      .send({ kalemler: [{ kitapId: id, adet: 2 }] });
    expect(siparis.status).toBe(201);
    expect(siparis.body).toMatchObject({
      toplam: 291,
      durum: 'hazirlaniyor',
      kalemler: [{ kitapId: id, kitapIsim: 'Kürk Mantolu Madonna', adet: 2, birimFiyat: 145.5 }],
    });
    expect(new Date(siparis.body.olusturulma).getTime()).not.toBeNaN();
    expect(await stok(id)).toBe(1);

    const liste = await request(app).get('/api/siparisler').set(yetki(musteriToken));
    expect(liste.body).toHaveLength(1);
  });

  it('kitabın fiyatı sonradan değişse de eski siparişin tutarı değişmez', async () => {
    const id = await kitapEkle('Aylak Adam', 100, 5);
    const siparis = await request(app)
      .post('/api/siparisler')
      .set(yetki(musteriToken))
      .send({ kalemler: [{ kitapId: id, adet: 1 }] });
    await request(app).patch(`/api/kitaplar/${id}`).set(yetki(adminToken)).send({ fiyat: 999 });

    const tekrar = await request(app).get(`/api/siparisler/${siparis.body.id}`).set(yetki(musteriToken));
    expect(tekrar.body.toplam).toBe(100);
    expect(tekrar.body.kalemler[0].birimFiyat).toBe(100);
  });

  it('stoğu yetersiz bir kalem varsa transaction geri alınır, diğer stoklar değişmez', async () => {
    const a = await kitapEkle('A', 10, 5);
    const b = await kitapEkle('B', 10, 1);
    const res = await request(app)
      .post('/api/siparisler')
      .set(yetki(musteriToken))
      .send({ kalemler: [{ kitapId: a, adet: 2 }, { kitapId: b, adet: 3 }] });
    expect(res.status).toBe(409);
    expect(await stok(a)).toBe(5);
    expect((await pool.query('SELECT count(*)::int AS n FROM siparisler')).rows[0].n).toBe(0);
  });

  it('aynı anda gelen 20 sipariş stoğu asla eksiye düşürmez (satır kilidi)', async () => {
    const id = await kitapEkle('Son 5 Kitap', 50, 5);
    const sonuclar = await Promise.all(
      Array.from({ length: 20 }, () =>
        request(app)
          .post('/api/siparisler')
          .set(yetki(musteriToken))
          .send({ kalemler: [{ kitapId: id, adet: 1 }] }),
      ),
    );
    const durumlar = sonuclar.map((r) => r.status);
    expect(durumlar.filter((d) => d === 201)).toHaveLength(5);
    expect(durumlar.filter((d) => d === 409)).toHaveLength(15);
    expect(await stok(id)).toBe(0);
  });

  it('ters sırada kilitlenen siparişler deadlock\'a girmez', async () => {
    const a = await kitapEkle('A', 10, 100);
    const b = await kitapEkle('B', 10, 100);
    const sonuclar = await Promise.all(
      Array.from({ length: 20 }, (_, i) =>
        request(app)
          .post('/api/siparisler')
          .set(yetki(musteriToken))
          .send({
            kalemler:
              i % 2 ? [{ kitapId: a, adet: 1 }, { kitapId: b, adet: 1 }] : [{ kitapId: b, adet: 1 }, { kitapId: a, adet: 1 }],
          }),
      ),
    );
    expect(sonuclar.every((r) => r.status === 201)).toBe(true);
    expect(await stok(a)).toBe(80);
    expect(await stok(b)).toBe(80);
  });

  it('siparişte geçen kitap silinemez (yabancı anahtar)', async () => {
    const id = await kitapEkle('Silinemez', 10, 5);
    await request(app)
      .post('/api/siparisler')
      .set(yetki(musteriToken))
      .send({ kalemler: [{ kitapId: id, adet: 1 }] });
    expect((await request(app).delete(`/api/kitaplar/${id}`).set(yetki(adminToken))).status).toBe(409);
  });

  it('sayfalama ve arama SQL\'de doğru çalışır', async () => {
    for (let i = 1; i <= 12; i++) await kitapEkle(`Roman ${i}`, 10, 1);
    await kitapEkle('Tutunamayanlar', 320, 1);
    const sayfa2 = await request(app).get('/api/kitaplar').query({ limit: 5, sayfa: 2 });
    expect(sayfa2.body.toplam).toBe(13);
    expect(sayfa2.body.veriler.map((k: { isim: string }) => k.isim)).toEqual([
      'Roman 6',
      'Roman 7',
      'Roman 8',
      'Roman 9',
      'Roman 10',
    ]);
    const arama = await request(app).get('/api/kitaplar').query({ arama: 'tutun' });
    expect(arama.body.toplam).toBe(1);
  });

  it('aynı e-postayla ikinci kayıt 409 döner (UNIQUE kısıtı)', async () => {
    const res = await request(app).post('/api/auth/kayit').send({ ad: 'Ayşe', eposta: 'ayse@test.com', sifre: 'xxxxxxxx' });
    expect(res.status).toBe(409);
  });
});
