import 'server-only';
import { cookies } from 'next/headers';
import { cache } from 'react';
import { apiIstek } from './api';
import { OTURUM_CEREZI } from './oturum-sabitleri';
import { Kullanici } from './tipler';

export { OTURUM_CEREZI };
const YEDI_GUN = 60 * 60 * 24 * 7;

export async function oturumAc(token: string) {
  (await cookies()).set(OTURUM_CEREZI, token, {
    httpOnly: true, // JavaScript okuyamaz: XSS ile token çalınamaz
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax', // Başka sitelerden gelen form gönderimlerinde çerez gitmez (CSRF koruması)
    path: '/',
    maxAge: YEDI_GUN, // API'deki JWT süresiyle aynı
  });
}

export async function oturumKapat() {
  (await cookies()).delete(OTURUM_CEREZI);
}

export async function token(): Promise<string | undefined> {
  return (await cookies()).get(OTURUM_CEREZI)?.value;
}

/**
 * Giriş yapmış kullanıcı ya da null. React cache() sayesinde aynı istek içinde
 * kaç bileşen çağırırsa çağırsın API'ye tek bir istek gider.
 */
export const aktifKullanici = cache(async (): Promise<Kullanici | null> => {
  const t = await token();
  if (!t) return null;
  const sonuc = await apiIstek<Kullanici>('/auth/ben', { token: t });
  return sonuc.ok ? sonuc.veri : null;
});
