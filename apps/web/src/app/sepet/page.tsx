import type { Metadata } from 'next';
import { SepetIcerigi } from './SepetIcerigi';

export const metadata: Metadata = { title: 'Sepet' };

export default function SepetSayfasi() {
  return (
    <div className="mx-auto max-w-3xl px-4 sm:px-6 py-12">
      <h1 className="text-4xl font-semibold">Sepetiniz</h1>
      <SepetIcerigi />
    </div>
  );
}
