import request from 'supertest';
import { beforeEach, describe, expect, it } from 'vitest';
import { createApp } from '../src/app';
import { sifreDogrula, sifreHashle } from '../src/auth/sifre';
import { TokenServisi } from '../src/auth/token';
import { testOrtami } from './yardimci';

describe('şifre', () => {
  it('doğru şifreyi kabul eder, yanlışı reddeder', async () => {
    const hash = await sifreHashle('gizli-sifre');
    expect(await sifreDogrula('gizli-sifre', hash)).toBe(true);
    expect(await sifreDogrula('yanlis-sifre', hash)).toBe(false);
  });

  it('aynı şifre için her seferinde farklı hash üretir (salt)', async () => {
    expect(await sifreHashle('ayni')).not.toBe(await sifreHashle('ayni'));
  });

  it('bozuk hash biçiminde false döner', async () => {
    expect(await sifreDogrula('x', 'bozuk')).toBe(false);
  });
});

describe('token', () => {
  it('imzalanan token doğrulanır', async () => {
    const tokenlar = new TokenServisi('a'.repeat(32));
    const token = await tokenlar.imzala({ kullaniciId: 7, rol: 'musteri' });
    expect(await tokenlar.dogrula(token)).toEqual({ kullaniciId: 7, rol: 'musteri' });
  });

  it('başka anahtarla imzalanmış token reddedilir', async () => {
    const token = await new TokenServisi('a'.repeat(32)).imzala({ kullaniciId: 1, rol: 'admin' });
    expect(await new TokenServisi('b'.repeat(32)).dogrula(token)).toBeNull();
  });

  it('süresi dolmuş token reddedilir', async () => {
    const tokenlar = new TokenServisi('a'.repeat(32), '-1s');
    expect(await tokenlar.dogrula(await tokenlar.imzala({ kullaniciId: 1, rol: 'musteri' }))).toBeNull();
  });
});

describe('Auth API', () => {
  let o: Awaited<ReturnType<typeof testOrtami>>;
  beforeEach(async () => {
    o = await testOrtami();
  });

  describe('POST /api/auth/kayit', () => {
    it('müşteri hesabı açar ve token döner, şifre hash yanıtta yer almaz', async () => {
      const res = await request(o.app)
        .post('/api/auth/kayit')
        .send({ ad: 'Mehmet', eposta: '  Mehmet@Test.com ', sifre: 'sifre-12345' });
      expect(res.status).toBe(201);
      expect(res.body.kullanici).toEqual({ id: expect.any(Number), ad: 'Mehmet', eposta: 'mehmet@test.com', rol: 'musteri' });
      expect(res.body.token).toEqual(expect.any(String));
      expect(JSON.stringify(res.body)).not.toContain('scrypt');
    });

    it('istekte rol: admin gönderilse bile müşteri oluşturur', async () => {
      const res = await request(o.app)
        .post('/api/auth/kayit')
        .send({ ad: 'Sinsi', eposta: 'sinsi@test.com', sifre: 'sifre-12345', rol: 'admin' });
      expect(res.body.kullanici.rol).toBe('musteri');
    });

    it('kayıtlı e-postada 409 döner (büyük/küçük harf fark etmez)', async () => {
      const res = await request(o.app)
        .post('/api/auth/kayit')
        .send({ ad: 'Ayşe', eposta: 'AYSE@test.com', sifre: 'baska-sifre-1' });
      expect(res.status).toBe(409);
    });

    it('kısa şifre ve geçersiz e-postada alan bazlı 400 döner', async () => {
      const res = await request(o.app).post('/api/auth/kayit').send({ ad: 'A', eposta: 'bozuk', sifre: '123' });
      expect(res.status).toBe(400);
      expect(res.body.detaylar.map((d: { alan: string }) => d.alan).sort()).toEqual(['ad', 'eposta', 'sifre']);
    });
  });

  describe('POST /api/auth/giris', () => {
    it('doğru bilgilerle token döner', async () => {
      const res = await request(o.app).post('/api/auth/giris').send({ eposta: 'ayse@test.com', sifre: 'guclu-sifre-1' });
      expect(res.status).toBe(200);
      expect(res.body.kullanici.eposta).toBe('ayse@test.com');
    });

    it('yanlış şifre ve olmayan e-posta için aynı mesajı verir', async () => {
      const yanlisSifre = await request(o.app).post('/api/auth/giris').send({ eposta: 'ayse@test.com', sifre: 'yanlis' });
      const olmayan = await request(o.app).post('/api/auth/giris').send({ eposta: 'yok@test.com', sifre: 'yanlis' });
      expect(yanlisSifre.status).toBe(401);
      expect(olmayan.status).toBe(401);
      expect(yanlisSifre.body).toEqual(olmayan.body);
    });
  });

  describe('GET /api/auth/ben', () => {
    it('token sahibini döner', async () => {
      const res = await request(o.app).get('/api/auth/ben').set(o.yetki(o.musteriToken));
      expect(res.body).toEqual({ id: o.musteri.id, ad: 'Ayşe Yılmaz', eposta: 'ayse@test.com', rol: 'musteri' });
    });

    it('token yoksa ya da bozuksa 401 döner', async () => {
      expect((await request(o.app).get('/api/auth/ben')).status).toBe(401);
      expect((await request(o.app).get('/api/auth/ben').set(o.yetki('bozuk.token.x'))).status).toBe(401);
    });

    it("silinmiş kullanıcının token'ı artık çalışmaz", async () => {
      o.veri.kullanicilar = o.veri.kullanicilar.filter((k) => k.id !== o.musteri.id);
      expect((await request(o.app).get('/api/auth/ben').set(o.yetki(o.musteriToken))).status).toBe(401);
    });
  });

  it('çok fazla giriş denemesinde 429 döner', async () => {
    const app = createApp({ ...o.repolar, tokenlar: o.tokenlar, authLimiti: 2 });
    for (let i = 0; i < 2; i++) await request(app).post('/api/auth/giris').send({ eposta: 'a@b.co', sifre: 'x' });
    expect((await request(app).post('/api/auth/giris').send({ eposta: 'a@b.co', sifre: 'x' })).status).toBe(429);
  });
});
