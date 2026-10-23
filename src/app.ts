import express from 'express';
import { kitapRouter } from './kitaplar/kitapRouter';
import { KitapRepository } from './kitaplar/kitapRepository';
import { hataYakalayici } from './middleware/hataYakalayici';

export function createApp(kitapRepo: KitapRepository) {
  const app = express();
  app.use(express.json());

  app.get('/health', (_req, res) => {
    res.json({ durum: 'ok' });
  });
  app.use('/api/kitaplar', kitapRouter(kitapRepo));

  app.use((_req, res) => {
    res.status(404).json({ hata: 'Bulunamadı' });
  });
  app.use(hataYakalayici);
  return app;
}
