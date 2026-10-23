import request from 'supertest';
import { createApp } from '../src/app';
import { sifreHashle } from '../src/auth/sifre';
import { TokenServisi } from '../src/auth/token';
import {
  BellekKitapRepository,
  BellekKullaniciRepository,
  BellekSiparisRepository,
  BellekVeri,
} from './bellek/repositoryler';

export const TEST_ANAHTARI = 'test-icin-en-az-otuz-iki-karakterlik-anahtar';

/** Her test için temiz bir uygulama + veri + hazır admin ve müşteri token'ları. */
export async function testOrtami() {
  const veri = new BellekVeri();
  const repolar = {
    kitaplar: new BellekKitapRepository(veri),
    kullanicilar: new BellekKullaniciRepository(veri),
    siparisler: new BellekSiparisRepository(veri),
  };
  const tokenlar = new TokenServisi(TEST_ANAHTARI);
  const app = createApp({ ...repolar, tokenlar, authLimiti: 1000 });

  const admin = (await repolar.kullanicilar.ekle({
    ad: 'Admin',
    eposta: 'admin@test.com',
    sifreHash: await sifreHashle('admin-sifresi'),
    rol: 'admin',
  }))!;
  const adminToken = await tokenlar.imzala({ kullaniciId: admin.id, rol: 'admin' });

  const kayit = await request(app)
    .post('/api/auth/kayit')
    .send({ ad: 'Ayşe Yılmaz', eposta: 'ayse@test.com', sifre: 'guclu-sifre-1' });
  const musteriToken: string = kayit.body.token;
  const musteri = kayit.body.kullanici as { id: number };

  const yetki = (token: string) => ({ Authorization: `Bearer ${token}` });
  return { app, veri, repolar, tokenlar, adminToken, musteriToken, musteri, yetki };
}
