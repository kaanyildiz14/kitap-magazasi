import Link from 'next/link';
import { Suspense } from 'react';
import { KitapKapagi } from '@/components/KitapKapagi';
import { Raf } from '@/components/Raf';
import { Sayfalama } from '@/components/Sayfalama';
import { SunucuHatasi } from '@/components/SunucuHatasi';
import { apiIstek } from '@/lib/api';
import { fiyat } from '@/lib/bicim';
import { Kitap, Sayfa } from '@/lib/tipler';

type Arama = Promise<{ arama?: string; sayfa?: string }>;
const KATALOG_LIMITI = 12;

export default function AnaSayfa({ searchParams }: { searchParams: Arama }) {
  return (
    <div className="mx-auto max-w-6xl px-4 sm:px-6">
      <Suspense fallback={<RafIskeleti />}>
        <Vitrin searchParams={searchParams} />
      </Suspense>
      <section id="katalog" className="scroll-mt-6 pb-20">
        <Suspense fallback={<p className="py-10 text-murekkep-soluk">Kitaplar yükleniyor…</p>}>
          <Katalog searchParams={searchParams} />
        </Suspense>
      </section>
    </div>
  );
}

async function Vitrin({ searchParams }: { searchParams: Arama }) {
  if ((await searchParams).arama) return null;
  const sonuc = await apiIstek<Sayfa<Kitap>>('/kitaplar?limit=40');
  if (!sonuc.ok || sonuc.veri.veriler.length === 0) return null;
  return (
    <section className="pt-12 pb-16">
      <h1 className="max-w-2xl text-4xl sm:text-5xl font-semibold">Türk edebiyatının sevilen kitapları, tek rafta.</h1>
      <p className="mt-4 max-w-xl text-lg text-murekkep-soluk">Bir sırta dokunun, kitabı açın.</p>
      <div className="mt-10">
        <Raf kitaplar={sonuc.veri.veriler} />
      </div>
    </section>
  );
}

function RafIskeleti() {
  return (
    <section className="pt-12 pb-16" aria-hidden>
      <div className="h-24 max-w-2xl rounded bg-kagit-koyu" />
      <div className="mt-10 h-[290px] border-b-[16px] border-raf/40" />
    </section>
  );
}

async function Katalog({ searchParams }: { searchParams: Arama }) {
  const { arama = '', sayfa = '1' } = await searchParams;
  const sayfaNo = Math.max(1, Number.parseInt(sayfa, 10) || 1);
  const sorgu = new URLSearchParams({ sayfa: String(sayfaNo), limit: String(KATALOG_LIMITI) });
  if (arama) sorgu.set('arama', arama);

  const sonuc = await apiIstek<Sayfa<Kitap>>(`/kitaplar?${sorgu}`);
  if (!sonuc.ok) return <SunucuHatasi mesaj={sonuc.hata} />;
  const { veriler, toplam } = sonuc.veri;

  return (
    <>
      <div className="flex flex-wrap items-baseline justify-between gap-2 border-b border-cizgi pb-3 pt-10">
        <h2 className="text-2xl font-semibold">{arama ? `“${arama}” için sonuçlar` : 'Tüm kitaplar'}</h2>
        <p className="text-sm text-murekkep-soluk tabular-nums">{toplam} kitap</p>
      </div>

      {veriler.length === 0 ? (
        <div className="py-16">
          <p className="text-lg">Bu aramayla eşleşen kitap yok.</p>
          <p className="text-murekkep-soluk">
            Kitap adının ya da yazarın bir kısmını deneyin veya{' '}
            <Link href="/" className="underline underline-offset-4">
              tüm kitaplara dönün
            </Link>
            .
          </p>
        </div>
      ) : (
        <ul className="mt-8 grid grid-cols-2 gap-x-5 gap-y-10 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
          {veriler.map((kitap) => (
            <li key={kitap.id}>
              <Link href={`/kitap/${kitap.id}`} className="group block">
                <div className="transition-transform duration-150 group-hover:-translate-y-1">
                  <KitapKapagi kitap={kitap} />
                </div>
                <h3 className="mt-3 font-serif text-lg font-semibold group-hover:underline underline-offset-4">
                  {kitap.isim}
                </h3>
                <p className="text-sm text-murekkep-soluk">{kitap.yazar}</p>
                <p className="mt-1 font-bold tabular-nums">
                  {kitap.stok === 0 ? <span className="text-murekkep-soluk">Tükendi</span> : fiyat(kitap.fiyat)}
                </p>
              </Link>
            </li>
          ))}
        </ul>
      )}
      <Sayfalama sayfa={sayfaNo} toplam={toplam} limit={KATALOG_LIMITI} arama={arama || undefined} />
    </>
  );
}
