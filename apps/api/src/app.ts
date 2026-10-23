import express from 'express';
import rateLimit from 'express-rate-limit';
import helmet from 'helmet';
import { authRouter } from './auth/authRouter';
import { KullaniciRepository } from './auth/kullaniciRepository';
import { TokenServisi } from './auth/token';
import { girisGerekli, rolGerekli } from './auth/yetki';
import { kitapRouter } from './kitaplar/kitapRouter';
import { KitapRepository } from './kitaplar/kitapRepository';
import { hataYakalayici } from './middleware/hataYakalayici';
import { siparisRouter } from './siparisler/siparisRouter';
import { SiparisRepository } from './siparisler/siparisRepository';

export interface Bagimliliklar {
  kitaplar: KitapRepository;
  kullanicilar: KullaniciRepository;
  siparisler: SiparisRepository;
  tokenlar: TokenServisi;
  /** Giriş/kayıt uç noktalarına IP başına 15 dakikada izin verilen istek sayısı (kaba kuvvet koruması). */
  authLimiti?: number;
}

// Uygulama dışarıdan verilen bağımlılıklarla kurulur: testler bellek içi repository'lerle,
// sunucu PostgreSQL ile aynı kodu çalıştırır.
export function createApp({ kitaplar, kullanicilar, siparisler, tokenlar, authLimiti = 20 }: Bagimliliklar) {
  const app = express();
  app.set('trust proxy', 1);
  app.use(helmet());
  app.use(express.json({ limit: '100kb' }));

  const giris = girisGerekli(tokenlar, kullanicilar);
  const authSiniri = rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: authLimiti,
    standardHeaders: 'draft-8',
    legacyHeaders: false,
    message: { hata: 'Çok fazla deneme. Lütfen biraz sonra tekrar deneyin.' },
  });

  app.get('/health', (_req, res) => {
    res.json({ durum: 'ok' });
  });
  app.use('/api/auth', authSiniri, authRouter(kullanicilar, tokenlar));
  app.use('/api/kitaplar', kitapRouter(kitaplar, [giris, rolGerekli('admin')]));
  app.use('/api/siparisler', siparisRouter(siparisler, giris));

  app.use((_req, res) => {
    res.status(404).json({ hata: 'Bulunamadı' });
  });
  app.use(hataYakalayici);
  return app;
}
