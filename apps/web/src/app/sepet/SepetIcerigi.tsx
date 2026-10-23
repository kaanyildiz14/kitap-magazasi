'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState, useTransition } from 'react';
import { siparisVer } from '@/actions/siparis';
import { FormMesaji } from '@/components/FormAlani';
import { KitapKapagi } from '@/components/KitapKapagi';
import { useSepet } from '@/components/SepetProvider';
import { fiyat } from '@/lib/bicim';
import { sepetToplami } from '@/lib/sepet';

export function SepetIcerigi() {
  const { sepet, hazir, adetDegistir, cikar, temizle } = useSepet();
  const router = useRouter();
  const [bekliyor, baslat] = useTransition();
  const [hata, setHata] = useState<{ mesaj: string; girisGerekli?: boolean } | null>(null);

  if (!hazir) return <p className="mt-8 text-murekkep-soluk">Sepet yükleniyor…</p>;

  if (sepet.length === 0) {
    return (
      <div className="mt-8">
        <p className="text-lg">Sepetiniz boş.</p>
        <Link href="/" className="mt-6 inline-block rounded-full bg-murekkep px-6 py-3 text-kagit hover:bg-eylem">
          Kitaplara göz atın
        </Link>
      </div>
    );
  }

  const siparisiTamamla = () =>
    baslat(async () => {
      setHata(null);
      const sonuc = await siparisVer(sepet.map(({ kitapId, adet }) => ({ kitapId, adet })));
      if ('siparisId' in sonuc) {
        temizle();
        router.push(`/siparisler/${sonuc.siparisId}?yeni=1`);
      } else {
        setHata({ mesaj: sonuc.hata, girisGerekli: sonuc.girisGerekli });
      }
    });

  return (
    <div className="mt-8">
      <ul className="divide-y divide-cizgi border-y border-cizgi">
        {sepet.map((k) => (
          <li key={k.kitapId} className="flex gap-4 py-5">
            <Link href={`/kitap/${k.kitapId}`} className="w-16 shrink-0">
              <KitapKapagi kitap={{ id: k.kitapId, isim: k.isim, yazar: k.yazar }} boyut="kucuk" />
            </Link>
            <div className="flex flex-1 flex-wrap items-start justify-between gap-4">
              <div>
                <Link href={`/kitap/${k.kitapId}`} className="font-serif text-lg font-semibold hover:underline underline-offset-4">
                  {k.isim}
                </Link>
                <p className="text-sm text-murekkep-soluk">{k.yazar}</p>
                <p className="mt-1 text-sm tabular-nums">{fiyat(k.fiyat)}</p>
              </div>
              <div className="flex items-center gap-4">
                <div className="flex items-center rounded-full border border-cizgi" role="group" aria-label={`${k.isim} adedi`}>
                  <button
                    type="button"
                    onClick={() => adetDegistir(k.kitapId, k.adet - 1)}
                    className="px-3 py-1.5 text-lg leading-none"
                    aria-label="Bir azalt"
                  >
                    −
                  </button>
                  <span className="w-8 text-center tabular-nums" aria-live="polite">
                    {k.adet}
                  </span>
                  <button
                    type="button"
                    onClick={() => adetDegistir(k.kitapId, k.adet + 1)}
                    disabled={k.adet >= k.stok}
                    className="px-3 py-1.5 text-lg leading-none disabled:opacity-30"
                    aria-label="Bir artır"
                  >
                    +
                  </button>
                </div>
                <p className="w-24 text-right font-bold tabular-nums">{fiyat(k.fiyat * k.adet)}</p>
                <button
                  type="button"
                  onClick={() => cikar(k.kitapId)}
                  className="text-sm text-murekkep-soluk underline underline-offset-4 hover:text-hata"
                >
                  Çıkar
                </button>
              </div>
            </div>
          </li>
        ))}
      </ul>

      <div className="mt-6 flex items-baseline justify-between">
        <p className="text-lg">Toplam</p>
        <p className="text-3xl font-bold tabular-nums">{fiyat(sepetToplami(sepet))}</p>
      </div>

      <div className="mt-6 flex flex-col gap-4">
        {hata && (
          <div className="flex flex-col gap-2">
            <FormMesaji hata={hata.mesaj} />
            {hata.girisGerekli && (
              <Link href="/giris?sonra=/sepet" className="font-bold underline underline-offset-4">
                Giriş yapın; sepetiniz burada bekliyor olacak.
              </Link>
            )}
          </div>
        )}
        <button
          type="button"
          onClick={siparisiTamamla}
          disabled={bekliyor}
          className="self-end rounded-full bg-eylem px-8 py-3 font-bold text-white hover:bg-eylem-koyu disabled:opacity-60"
        >
          {bekliyor ? 'Sipariş veriliyor…' : 'Siparişi tamamla'}
        </button>
        <p className="self-end text-sm text-murekkep-soluk">Ödeme alınmaz; bu bir portföy projesidir.</p>
      </div>
    </div>
  );
}
