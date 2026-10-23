import { Router } from 'express';
import { HttpHatasi } from '../middleware/hataYakalayici';
import { disariVer, girisSemasi, kayitSemasi } from './kullanici';
import { KullaniciRepository } from './kullaniciRepository';
import { sifreDogrula, sifreHashle } from './sifre';
import { TokenServisi } from './token';
import { aktifKullanici, girisGerekli } from './yetki';

// Kullanıcı yokken de bir hash doğrulanır; böylece "e-posta kayıtlı mı" bilgisi yanıt süresinden anlaşılamaz.
const SAHTE_HASH = sifreHashle('zamanlama-icin-sahte-sifre');

export function authRouter(kullanicilar: KullaniciRepository, tokenlar: TokenServisi): Router {
  const router = Router();

  router.post('/kayit', async (req, res) => {
    const { ad, eposta, sifre } = kayitSemasi.parse(req.body);
    const kullanici = await kullanicilar.ekle({ ad, eposta, sifreHash: await sifreHashle(sifre), rol: 'musteri' });
    if (!kullanici) throw new HttpHatasi(409, 'Bu e-posta adresiyle zaten bir hesap var');

    const token = await tokenlar.imzala({ kullaniciId: kullanici.id, rol: kullanici.rol });
    res.status(201).json({ kullanici: disariVer(kullanici), token });
  });

  router.post('/giris', async (req, res) => {
    const { eposta, sifre } = girisSemasi.parse(req.body);
    const kayit = await kullanicilar.epostaIleGetir(eposta);
    const dogru = await sifreDogrula(sifre, kayit?.sifreHash ?? (await SAHTE_HASH));
    // Hangi alanın yanlış olduğunu söylemeyiz: kayıtlı e-postalar tahmin edilemesin
    if (!kayit || !dogru) throw new HttpHatasi(401, 'E-posta veya şifre hatalı');

    const token = await tokenlar.imzala({ kullaniciId: kayit.id, rol: kayit.rol });
    res.json({ kullanici: disariVer(kayit), token });
  });

  router.get('/ben', girisGerekli(tokenlar, kullanicilar), (_req, res) => {
    res.json(disariVer(aktifKullanici(res)));
  });

  return router;
}
