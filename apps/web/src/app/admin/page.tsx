import type { Metadata } from 'next';
import { Suspense } from 'react';
import { SunucuHatasi } from '@/components/SunucuHatasi';
import { apiIstek } from '@/lib/api';
import { Kitap, Sayfa } from '@/lib/tipler';
import { KitapFormu } from './KitapFormu';
import { KitapSatiri } from './KitapSatiri';

export const metadata: Metadata = { title: 'Kitaplar · Yönetim' };

export default function AdminKitaplarSayfasi() {
  return (
    <Suspense fallback={<p className="text-murekkep-soluk">Yükleniyor…</p>}>
      <AdminKitaplar />
    </Suspense>
  );
}

async function AdminKitaplar() {
  const sonuc = await apiIstek<Sayfa<Kitap>>('/kitaplar?limit=100');
  if (!sonuc.ok) return <SunucuHatasi mesaj={sonuc.hata} />;
  const { veriler, toplam } = sonuc.veri;

  return (
    <div className="flex flex-col gap-12">
      <section>
        <h2 className="mb-4 text-2xl font-semibold">Yeni kitap ekle</h2>
        <KitapFormu />
      </section>
      <section>
        <div className="mb-2 flex items-baseline justify-between">
          <h2 className="text-2xl font-semibold">Kitaplar</h2>
          <p className="text-sm text-murekkep-soluk tabular-nums">
            {toplam > veriler.length ? `İlk ${veriler.length} / ${toplam}` : `${toplam} kitap`}
          </p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px] text-left">
            <thead className="border-b border-cizgi text-sm text-murekkep-soluk">
              <tr>
                <th className="py-2 pr-3 font-normal">Kitap</th>
                <th className="py-2 pr-3 font-normal">Yazar</th>
                <th className="py-2 pr-3 text-right font-normal">Fiyat</th>
                <th className="py-2 pr-3 text-right font-normal">Stok</th>
                <th className="py-2 text-right font-normal">
                  <span className="sr-only">İşlemler</span>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-cizgi">
              {veriler.map((k) => (
                <KitapSatiri key={`${k.id}-${k.fiyat}-${k.stok}-${k.isim}`} kitap={k} />
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
