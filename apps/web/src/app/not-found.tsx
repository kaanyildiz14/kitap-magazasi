import Link from 'next/link';

export default function BulunamadiSayfasi() {
  return (
    <div className="mx-auto max-w-2xl px-4 sm:px-6 py-24">
      <h1 className="text-4xl font-semibold">Bu sayfa rafta yok.</h1>
      <p className="mt-4 text-lg text-murekkep-soluk">Aradığınız kitap kaldırılmış ya da adres yanlış yazılmış olabilir.</p>
      <Link href="/" className="mt-8 inline-block rounded-full bg-murekkep px-6 py-3 text-kagit hover:bg-eylem">
        Ana sayfaya dön
      </Link>
    </div>
  );
}
