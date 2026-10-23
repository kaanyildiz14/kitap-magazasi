import { Router } from 'express';
import { HttpHatasi } from '../middleware/hataYakalayici';
import { idSemasi, kitapGuncelleSemasi, kitapOlusturSemasi, satisSemasi } from './kitap';
import { KitapRepository } from './kitapRepository';

export function kitapRouter(repo: KitapRepository): Router {
  const router = Router();

  router.get('/', async (req, res) => {
    const arama = typeof req.query.arama === 'string' ? req.query.arama : undefined;
    res.json(await repo.listele(arama));
  });

  router.get('/:id', async (req, res) => {
    const kitap = await repo.getir(idSemasi.parse(req.params.id));
    if (!kitap) throw new HttpHatasi(404, 'Kitap bulunamadı');
    res.json(kitap);
  });

  router.post('/', async (req, res) => {
    const kitap = await repo.ekle(kitapOlusturSemasi.parse(req.body));
    res.status(201).location(`/api/kitaplar/${kitap.id}`).json(kitap);
  });

  router.patch('/:id', async (req, res) => {
    const kitap = await repo.guncelle(idSemasi.parse(req.params.id), kitapGuncelleSemasi.parse(req.body));
    if (!kitap) throw new HttpHatasi(404, 'Kitap bulunamadı');
    res.json(kitap);
  });

  router.delete('/:id', async (req, res) => {
    const silindi = await repo.sil(idSemasi.parse(req.params.id));
    if (!silindi) throw new HttpHatasi(404, 'Kitap bulunamadı');
    res.status(204).end();
  });

  router.post('/:id/satis', async (req, res) => {
    const id = idSemasi.parse(req.params.id);
    const { adet } = satisSemasi.parse(req.body ?? {});
    const kitap = await repo.sat(id, adet);
    if (kitap) return res.json(kitap);
    if (!(await repo.getir(id))) throw new HttpHatasi(404, 'Kitap bulunamadı');
    throw new HttpHatasi(409, 'Yetersiz stok');
  });

  return router;
}
