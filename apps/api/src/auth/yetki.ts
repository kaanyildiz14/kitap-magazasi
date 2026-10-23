import { RequestHandler, Response } from 'express';
import { HttpHatasi } from '../middleware/hataYakalayici';
import { Kullanici, Rol } from './kullanici';
import { KullaniciRepository } from './kullaniciRepository';
import { TokenServisi } from './token';

/**
 * "Authorization: Bearer <token>" başlığını doğrular ve kullanıcıyı res.locals'a koyar.
 * Kullanıcı her istekte veritabanından okunur: silinen ya da rolü değişen biri eski token'la devam edemez.
 */
export function girisGerekli(tokenlar: TokenServisi, kullanicilar: KullaniciRepository): RequestHandler {
  return async (req, res, next) => {
    const [tur, token] = req.headers.authorization?.split(' ') ?? [];
    if (tur !== 'Bearer' || !token) throw new HttpHatasi(401, 'Giriş yapmanız gerekiyor');

    const icerik = await tokenlar.dogrula(token);
    const kullanici = icerik && (await kullanicilar.getir(icerik.kullaniciId));
    if (!kullanici) throw new HttpHatasi(401, 'Oturumunuzun süresi dolmuş, tekrar giriş yapın');

    res.locals.kullanici = kullanici;
    next();
  };
}

/** girisGerekli'den sonra kullanılır. */
export function rolGerekli(rol: Rol): RequestHandler {
  return (_req, res, next) => {
    if (aktifKullanici(res).rol !== rol) throw new HttpHatasi(403, 'Bu işlem için yetkiniz yok');
    next();
  };
}

export function aktifKullanici(res: Response): Kullanici {
  return res.locals.kullanici as Kullanici;
}
