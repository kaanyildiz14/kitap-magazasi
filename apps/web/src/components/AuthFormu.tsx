'use client';

import Link from 'next/link';
import { useActionState } from 'react';
import { girisYap, kayitOl } from '@/actions/auth';
import { FormDurumu } from '@/lib/tipler';
import { FormAlani, FormMesaji } from './FormAlani';

export function AuthFormu({ tur, sonra }: { tur: 'giris' | 'kayit'; sonra?: string }) {
  const [durum, eylem, bekliyor] = useActionState<FormDurumu, FormData>(tur === 'giris' ? girisYap : kayitOl, {});
  const h = durum.alanHatalari ?? {};
  const d = durum.degerler ?? {};
  const digerSayfa = `/${tur === 'giris' ? 'kayit' : 'giris'}${sonra ? `?sonra=${encodeURIComponent(sonra)}` : ''}`;

  return (
    <form action={eylem} className="flex flex-col gap-5" noValidate>
      {sonra && <input type="hidden" name="sonra" value={sonra} />}
      {/* Alan hatası varsa genel mesaj tekrar edilmez */}
      <FormMesaji hata={Object.keys(h).length ? undefined : durum.hata} />
      {tur === 'kayit' && <FormAlani etiket="Ad soyad" name="ad" autoComplete="name" required defaultValue={d.ad} hata={h.ad} />}
      <FormAlani
        etiket="E-posta"
        name="eposta"
        type="email"
        autoComplete="email"
        required
        defaultValue={d.eposta}
        hata={h.eposta}
      />
      <FormAlani
        etiket="Şifre"
        name="sifre"
        type="password"
        autoComplete={tur === 'giris' ? 'current-password' : 'new-password'}
        required
        minLength={tur === 'kayit' ? 8 : undefined}
        hata={h.sifre}
      />
      {tur === 'kayit' && !h.sifre && <p className="-mt-3 text-sm text-murekkep-soluk">En az 8 karakter.</p>}
      <button
        disabled={bekliyor}
        className="rounded-full bg-eylem px-6 py-3 font-bold text-white hover:bg-eylem-koyu disabled:opacity-60"
      >
        {tur === 'giris' ? (bekliyor ? 'Giriş yapılıyor…' : 'Giriş yap') : bekliyor ? 'Hesap açılıyor…' : 'Hesap aç'}
      </button>
      <p className="text-sm text-murekkep-soluk">
        {tur === 'giris' ? 'Hesabınız yok mu? ' : 'Zaten hesabınız var mı? '}
        <Link href={digerSayfa} className="font-bold text-murekkep underline underline-offset-4">
          {tur === 'giris' ? 'Hesap açın' : 'Giriş yapın'}
        </Link>
      </p>
    </form>
  );
}
