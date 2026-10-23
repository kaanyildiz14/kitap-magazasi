import { RequestHandler, Router } from 'express';
import { aktifKullanici, rolGerekli } from '../auth/yetki';
import { idSemasi } from '../kitaplar/kitap';
import { HttpHatasi } from '../middleware/hataYakalayici';
import { durumGuncelleSemasi, kalemleriBirlestir, siparisOlusturSemasi } from './siparis';
import { SiparisRepository } from './siparisRepository';

export function siparisRouter(repo: SiparisRepository, girisGerekli: RequestHandler): Router {
  const router = Router();
  router.use(girisGerekli);

  router.post('/', async (req, res) => {
    const { kalemler } = siparisOlusturSemasi.parse(req.body);
    const sonuc = await repo.olustur(aktifKullanici(res).id, kalemleriBirlestir(kalemler));

    if (sonuc.tur === 'kitap_yok') throw new HttpHatasi(404, `Kitap bulunamadı (id: ${sonuc.kitapId})`);
    if (sonuc.tur === 'yetersiz_stok') {
      throw new HttpHatasi(409, `Yetersiz stok (kitap id: ${sonuc.kitapId}, mevcut: ${sonuc.mevcut})`);
    }
    res.status(201).location(`/api/siparisler/${sonuc.siparis.id}`).json(sonuc.siparis);
  });

  // Müşteri kendi siparişlerini, admin hepsini görür
  router.get('/', async (_req, res) => {
    const kullanici = aktifKullanici(res);
    res.json(await repo.listele(kullanici.rol === 'admin' ? undefined : kullanici.id));
  });

  router.get('/:id', async (req, res) => {
    const kullanici = aktifKullanici(res);
    const siparis = await repo.getir(idSemasi.parse(req.params.id));
    // Başkasının siparişi için 404: o siparişin var olduğunu bile söylemeyiz
    if (!siparis || (kullanici.rol !== 'admin' && siparis.kullaniciId !== kullanici.id)) {
      throw new HttpHatasi(404, 'Sipariş bulunamadı');
    }
    res.json(siparis);
  });

  router.patch('/:id/durum', rolGerekli('admin'), async (req, res) => {
    const { durum } = durumGuncelleSemasi.parse(req.body);
    const siparis = await repo.durumGuncelle(idSemasi.parse(req.params.id), durum);
    if (!siparis) throw new HttpHatasi(404, 'Sipariş bulunamadı');
    res.json(siparis);
  });

  return router;
}
