'use server';

import { redirect } from 'next/navigation';
import { alanHatalari, apiIstek } from '@/lib/api';
import { oturumAc, oturumKapat } from '@/lib/oturum';
import { FormDurumu, Kullanici } from '@/lib/tipler';
import { guvenliDonus } from '@/lib/yonlendirme';

type AuthYaniti = { kullanici: Kullanici; token: string };

const metinler = (form: FormData, ...alanlar: string[]) =>
  Object.fromEntries(alanlar.map((a) => [a, String(form.get(a) ?? '')]));

export async function girisYap(_onceki: FormDurumu, form: FormData): Promise<FormDurumu> {
  const sonuc = await apiIstek<AuthYaniti>('/auth/giris', {
    method: 'POST',
    govde: { eposta: form.get('eposta'), sifre: form.get('sifre') },
  });
  if (!sonuc.ok) {
    return { hata: sonuc.hata, alanHatalari: alanHatalari(sonuc.detaylar), degerler: metinler(form, 'eposta') };
  }

  await oturumAc(sonuc.veri.token);
  redirect(guvenliDonus(form.get('sonra'), sonuc.veri.kullanici.rol === 'admin' ? '/admin' : '/'));
}

export async function kayitOl(_onceki: FormDurumu, form: FormData): Promise<FormDurumu> {
  const sonuc = await apiIstek<AuthYaniti>('/auth/kayit', {
    method: 'POST',
    govde: { ad: form.get('ad'), eposta: form.get('eposta'), sifre: form.get('sifre') },
  });
  if (!sonuc.ok) {
    return { hata: sonuc.hata, alanHatalari: alanHatalari(sonuc.detaylar), degerler: metinler(form, 'ad', 'eposta') };
  }

  await oturumAc(sonuc.veri.token);
  redirect(guvenliDonus(form.get('sonra')));
}

export async function cikisYap() {
  await oturumKapat();
  redirect('/');
}
