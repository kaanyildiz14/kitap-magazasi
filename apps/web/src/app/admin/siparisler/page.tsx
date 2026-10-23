import type { Metadata } from 'next';
import { Suspense } from 'react';
import { SunucuHatasi } from '@/components/SunucuHatasi';
import { apiIstek } from '@/lib/api';
import { fiyat, tarihSaat } from '@/lib/bicim';
import { token } from '@/lib/oturum';
import { Siparis } from '@/lib/tipler';
import { DurumSecici } from './DurumSecici';

export const metadata: Metadata = { title: 'Siparişler · Yönetim' };

export default function AdminSiparislerSayfasi() {
  return (
    <Suspense fallback={<p className="text-murekkep-soluk">Yükleniyor…</p>}>
      <AdminSiparisler />
    </Suspense>
  );
}

async function AdminSiparisler() {
  const t = await token();
  const sonuc = await apiIstek<Siparis[]>('/siparisler', { token: t });
  if (!sonuc.ok) return <SunucuHatasi mesaj={sonuc.hata} />;
  if (sonuc.veri.length === 0) return <p className="text-lg">Henüz sipariş yok.</p>;

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[720px] text-left">
        <thead className="border-b border-cizgi text-sm text-murekkep-soluk">
          <tr>
            <th className="py-2 pr-3 font-normal">Sipariş</th>
            <th className="py-2 pr-3 font-normal">Kitaplar</th>
            <th className="py-2 pr-3 text-right font-normal">Toplam</th>
            <th className="py-2 font-normal">Durum</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-cizgi">
          {sonuc.veri.map((s) => (
            <tr key={s.id} className="align-top">
              <td className="py-3 pr-3">
                <p className="font-bold">#{s.id}</p>
                <p className="text-sm text-murekkep-soluk">Müşteri #{s.kullaniciId}</p>
                <p className="text-sm text-murekkep-soluk">{tarihSaat(s.olusturulma)}</p>
              </td>
              <td className="py-3 pr-3 text-sm">
                {s.kalemler.map((k) => (
                  <p key={k.kitapId}>
                    {k.kitapIsim} <span className="text-murekkep-soluk">× {k.adet}</span>
                  </p>
                ))}
              </td>
              <td className="py-3 pr-3 text-right font-bold tabular-nums">{fiyat(s.toplam)}</td>
              <td className="py-3">
                <DurumSecici siparisId={s.id} durum={s.durum} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
