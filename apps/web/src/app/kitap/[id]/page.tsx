import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Suspense } from 'react';
import { KitapKapagi } from '@/components/KitapKapagi';
import { SepeteEkleButonu } from '@/components/SepeteEkleButonu';
import { SunucuHatasi } from '@/components/SunucuHatasi';
import { apiIstek } from '@/lib/api';
import { fiyat } from '@/lib/bicim';
import { Kitap } from '@/lib/tipler';

type Parametreler = Promise<{ id: string }>;

export default function KitapSayfasi({ params }: { params: Parametreler }) {
  return (
    <div className="mx-auto max-w-5xl px-4 sm:px-6 py-10">
      <Link href="/" className="text-sm text-murekkep-soluk underline-offset-4 hover:underline">
        Rafa dön
      </Link>
      <Suspense fallback={<p className="py-16 text-murekkep-soluk">Kitap yükleniyor…</p>}>
        <KitapDetayi params={params} />
      </Suspense>
    </div>
  );
}

async function KitapDetayi({ params }: { params: Parametreler }) {
  const { id } = await params;
  if (!/^\d+$/.test(id)) notFound();
  const sonuc = await apiIstek<Kitap>(`/kitaplar/${id}`);
  if (!sonuc.ok && sonuc.durum === 404) notFound();
  if (!sonuc.ok) return <SunucuHatasi mesaj={sonuc.hata} />;
  const kitap = sonuc.veri;

  return (
    <article className="mt-8 grid gap-10 md:grid-cols-[minmax(0,22rem)_1fr] md:gap-16">
      <div className="max-w-xs md:max-w-none">
        <KitapKapagi kitap={kitap} boyut="buyuk" />
      </div>
      <div className="flex flex-col gap-6 md:pt-6">
        <div>
          <h1 className="text-4xl sm:text-5xl font-semibold">{kitap.isim}</h1>
          <p className="mt-3 text-xl text-murekkep-soluk">{kitap.yazar}</p>
        </div>
        <p className="text-3xl font-bold tabular-nums">{fiyat(kitap.fiyat)}</p>
        <SepeteEkleButonu kitap={kitap} />
      </div>
    </article>
  );
}
