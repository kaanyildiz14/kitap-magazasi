import 'server-only';
import { notFound, redirect } from 'next/navigation';
import { aktifKullanici, token } from './oturum';
import { Kullanici } from './tipler';

/** Giriş yapılmamışsa (ya da oturum süresi dolmuşsa) giriş sayfasına yönlendirir. */
export async function girisGerekli(donus: string): Promise<{ kullanici: Kullanici; token: string }> {
  const kullanici = await aktifKullanici();
  const t = await token();
  if (!kullanici || !t) redirect(`/giris?sonra=${encodeURIComponent(donus)}`);
  return { kullanici, token: t };
}

/** Admin olmayanlara sayfanın varlığını göstermez. Asıl yetki kontrolü API'dedir. */
export async function adminGerekli(donus: string) {
  const oturum = await girisGerekli(donus);
  if (oturum.kullanici.rol !== 'admin') notFound();
  return oturum;
}
