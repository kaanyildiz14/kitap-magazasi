import type { Metadata } from 'next';
import Link from 'next/link';
import { Suspense } from 'react';
import { DurumEtiketi } from '@/components/DurumEtiketi';
import { SunucuHatasi } from '@/components/SunucuHatasi';
import { apiIstek } from '@/lib/api';
import { fiyat, tarihSaat } from '@/lib/bicim';
import { girisGerekli } from '@/lib/sayfaKorumasi';
import { Siparis } from '@/lib/tipler';

export const metadata: Metadata = { title: 'Siparişlerim' };

export default function SiparislerSayfasi() {
  return (
    <div className="mx-auto max-w-3xl px-4 sm:px-6 py-12">
      <h1 className="text-4xl font-semibold">Siparişlerim</h1>
      <Suspense fallback={<p className="mt-8 text-murekkep-soluk">Siparişler yükleniyor…</p>}>
        <SiparisListesi />
      </Suspense>
    </div>
  );
}

async function SiparisListesi() {
  const { token, kullanici } = await girisGerekli('/siparisler');
  const sonuc = await apiIstek<Siparis[]>('/siparisler', { token });
  if (!sonuc.ok) return <SunucuHatasi mesaj={sonuc.hata} />;
  // Admin API'den tüm siparişleri alır; bu sayfa yalnızca kendi siparişlerini gösterir
  const siparisler = sonuc.veri.filter((s) => s.kullaniciId === kullanici.id);

  if (siparisler.length === 0) {
    return (
      <div className="mt-8">
        <p className="text-lg">Henüz siparişiniz yok.</p>
        <Link href="/" className="mt-6 inline-block rounded-full bg-murekkep px-6 py-3 text-kagit hover:bg-eylem">
          Kitaplara göz atın
        </Link>
      </div>
    );
  }

  return (
    <ul className="mt-8 divide-y divide-cizgi border-y border-cizgi">
      {siparisler.map((s) => (
        <li key={s.id}>
          <Link href={`/siparisler/${s.id}`} className="flex flex-wrap items-center justify-between gap-4 py-5 hover:bg-white/40">
            <div>
              <p className="font-bold">Sipariş #{s.id}</p>
              <p className="text-sm text-murekkep-soluk">{tarihSaat(s.olusturulma)}</p>
              <p className="mt-1 text-sm">{s.kalemler.map((k) => `${k.kitapIsim} (${k.adet})`).join(', ')}</p>
            </div>
            <div className="flex items-center gap-4">
              <DurumEtiketi durum={s.durum} />
              <p className="w-28 text-right font-bold tabular-nums">{fiyat(s.toplam)}</p>
            </div>
          </Link>
        </li>
      ))}
    </ul>
  );
}
