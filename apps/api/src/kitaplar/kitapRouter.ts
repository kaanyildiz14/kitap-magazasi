import { RequestHandler, Router } from 'express';
import { HttpHatasi } from '../middleware/hataYakalayici';
import { idSemasi, kitapGuncelleSemasi, kitapListeSemasi, kitapOlusturSemasi } from './kitap';
import { KitapRepository } from './kitapRepository';

/** adminGerekli: okuma herkese açık, yazma işlemleri yalnızca admin'e. */
export function kitapRouter(repo: KitapRepository, adminGerekli: RequestHandler[]): Router {
  const router = Router();

  router.get('/', async (req, res) => {
    res.json(await repo.listele(kitapListeSemasi.parse(req.query)));
  });

  router.get('/:id', async (req, res) => {
    const kitap = await repo.getir(idSemasi.parse(req.params.id));
    if (!kitap) throw new HttpHatasi(404, 'Kitap bulunamadı');
    res.json(kitap);
  });

  router.post('/', ...adminGerekli, async (req, res) => {
    const kitap = await repo.ekle(kitapOlusturSemasi.parse(req.body));
    res.status(201).location(`/api/kitaplar/${kitap.id}`).json(kitap);
  });

  router.patch('/:id', ...adminGerekli, async (req, res) => {
    const kitap = await repo.guncelle(idSemasi.parse(req.params.id), kitapGuncelleSemasi.parse(req.body));
    if (!kitap) throw new HttpHatasi(404, 'Kitap bulunamadı');
    res.json(kitap);
  });

  router.delete('/:id', ...adminGerekli, async (req, res) => {
    const sonuc = await repo.sil(idSemasi.parse(req.params.id));
    if (sonuc === 'bulunamadi') throw new HttpHatasi(404, 'Kitap bulunamadı');
    if (sonuc === 'siparisi_var') {
      throw new HttpHatasi(409, 'Bu kitap siparişlerde geçtiği için silinemez; stoğunu 0 yapabilirsiniz');
    }
    res.status(204).end();
  });

  return router;
}
