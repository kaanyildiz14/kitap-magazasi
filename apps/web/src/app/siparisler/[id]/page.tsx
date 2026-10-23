import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Suspense } from 'react';
import { DurumEtiketi } from '@/components/DurumEtiketi';
import { FormMesaji } from '@/components/FormAlani';
import { SunucuHatasi } from '@/components/SunucuHatasi';
import { apiIstek } from '@/lib/api';
import { fiyat, tarihSaat } from '@/lib/bicim';
import { girisGerekli } from '@/lib/sayfaKorumasi';
import { Siparis } from '@/lib/tipler';

type Props = { params: Promise<{ id: string }>; searchParams: Promise<{ yeni?: string }> };

export default function SiparisSayfasi(props: Props) {
  return (
    <div className="mx-auto max-w-3xl px-4 sm:px-6 py-12">
      <Link href="/siparisler" className="text-sm text-murekkep-soluk underline-offset-4 hover:underline">
        Tüm siparişlerim
      </Link>
      <Suspense fallback={<p className="mt-8 text-murekkep-soluk">Sipariş yükleniyor…</p>}>
        <SiparisDetayi {...props} />
      </Suspense>
    </div>
  );
}

async function SiparisDetayi({ params, searchParams }: Props) {
  const { id } = await params;
  const { yeni } = await searchParams;
  if (!/^\d+$/.test(id)) notFound();
  const { token } = await girisGerekli(`/siparisler/${id}`);
  const sonuc = await apiIstek<Siparis>(`/siparisler/${id}`, { token });
  if (!sonuc.ok && sonuc.durum === 404) notFound();
  if (!sonuc.ok) return <SunucuHatasi mesaj={sonuc.hata} />;
  const s = sonuc.veri;

  return (
    <article className="mt-6 flex flex-col gap-6">
      {yeni && <FormMesaji mesaj="Siparişiniz alındı. Durumunu bu sayfadan takip edebilirsiniz." />}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-4xl font-semibold">Sipariş #{s.id}</h1>
          <p className="mt-2 text-murekkep-soluk">{tarihSaat(s.olusturulma)}</p>
        </div>
        <DurumEtiketi durum={s.durum} />
      </div>
      <table className="w-full text-left">
        <thead className="border-b border-cizgi text-sm text-murekkep-soluk">
          <tr>
            <th className="py-2 font-normal">Kitap</th>
            <th className="py-2 text-right font-normal">Adet</th>
            <th className="py-2 text-right font-normal">Birim fiyat</th>
            <th className="py-2 text-right font-normal">Tutar</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-cizgi">
          {s.kalemler.map((k) => (
            <tr key={k.kitapId}>
              <td className="py-3">
                <Link href={`/kitap/${k.kitapId}`} className="font-serif font-semibold hover:underline underline-offset-4">
                  {k.kitapIsim}
                </Link>
              </td>
              <td className="py-3 text-right tabular-nums">{k.adet}</td>
              <td className="py-3 text-right tabular-nums">{fiyat(k.birimFiyat)}</td>
              <td className="py-3 text-right tabular-nums">{fiyat(k.birimFiyat * k.adet)}</td>
            </tr>
          ))}
        </tbody>
        <tfoot className="border-t-2 border-murekkep">
          <tr>
            <td className="py-3 font-bold" colSpan={3}>
              Toplam
            </td>
            <td className="py-3 text-right text-xl font-bold tabular-nums">{fiyat(s.toplam)}</td>
          </tr>
        </tfoot>
      </table>
    </article>
  );
}
