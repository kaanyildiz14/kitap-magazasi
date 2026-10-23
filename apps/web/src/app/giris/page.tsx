import type { Metadata } from 'next';
import { Suspense } from 'react';
import { AuthFormu } from '@/components/AuthFormu';
import { guvenliDonus } from '@/lib/yonlendirme';

export const metadata: Metadata = { title: 'Giriş yap' };

type Arama = Promise<{ sonra?: string }>;

export default function GirisSayfasi({ searchParams }: { searchParams: Arama }) {
  return (
    <div className="mx-auto max-w-md px-4 sm:px-6 py-16">
      <h1 className="text-4xl font-semibold">Giriş yap</h1>
      <p className="mt-3 mb-8 text-murekkep-soluk">Siparişlerinizi görmek ve sipariş vermek için giriş yapın.</p>
      <Suspense>
        <Form searchParams={searchParams} />
      </Suspense>
    </div>
  );
}

async function Form({ searchParams }: { searchParams: Arama }) {
  const { sonra } = await searchParams;
  return <AuthFormu tur="giris" sonra={sonra ? guvenliDonus(sonra) : undefined} />;
}
