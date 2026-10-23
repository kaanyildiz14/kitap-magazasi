'use client';

import { useSearchParams } from 'next/navigation';

export function AramaKutusu() {
  const arama = useSearchParams().get('arama') ?? '';
  return (
    <form action="/" role="search" className="order-3 w-full sm:order-none sm:w-auto sm:flex-1 sm:max-w-md">
      <label htmlFor="arama" className="sr-only">
        Kitap veya yazar ara
      </label>
      <input
        id="arama"
        key={arama}
        name="arama"
        type="search"
        defaultValue={arama}
        placeholder="Kitap ya da yazar ara"
        className="w-full rounded-full border border-cizgi bg-white/60 px-4 py-2 placeholder:text-murekkep-soluk focus:bg-white"
      />
    </form>
  );
}
