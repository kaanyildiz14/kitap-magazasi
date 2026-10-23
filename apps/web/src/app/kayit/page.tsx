import type { Metadata } from 'next';
import { Suspense } from 'react';
import { AuthFormu } from '@/components/AuthFormu';
import { guvenliDonus } from '@/lib/yonlendirme';

export const metadata: Metadata = { title: 'Hesap aç' };

type Arama = Promise<{ sonra?: string }>;

export default function KayitSayfasi({ searchParams }: { searchParams: Arama }) {
  return (
    <div className="mx-auto max-w-md px-4 sm:px-6 py-16">
      <h1 className="text-4xl font-semibold">Hesap aç</h1>
      <p className="mt-3 mb-8 text-murekkep-soluk">Sipariş verebilmek için bir hesap açın. Bir dakika sürer.</p>
      <Suspense>
        <Form searchParams={searchParams} />
      </Suspense>
    </div>
  );
}

async function Form({ searchParams }: { searchParams: Arama }) {
  const { sonra } = await searchParams;
  return <AuthFormu tur="kayit" sonra={sonra ? guvenliDonus(sonra) : undefined} />;
}
