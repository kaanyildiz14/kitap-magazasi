import Link from 'next/link';

export function Sayfalama({ sayfa, toplam, limit, arama }: { sayfa: number; toplam: number; limit: number; arama?: string }) {
  const sayfaSayisi = Math.max(1, Math.ceil(toplam / limit));
  if (sayfaSayisi === 1) return null;
  const adres = (s: number) => {
    const p = new URLSearchParams();
    if (arama) p.set('arama', arama);
    if (s > 1) p.set('sayfa', String(s));
    const q = p.toString();
    return q ? `/?${q}#katalog` : '/#katalog';
  };
  const baglanti = 'rounded-full border border-cizgi px-4 py-2 hover:border-murekkep';
  return (
    <nav aria-label="Sayfalar" className="mt-10 flex items-center justify-between gap-4">
      {sayfa > 1 ? (
        <Link href={adres(sayfa - 1)} className={baglanti}>
          Önceki sayfa
        </Link>
      ) : (
        <span />
      )}
      <p className="text-sm text-murekkep-soluk tabular-nums">
        Sayfa {sayfa} / {sayfaSayisi}
      </p>
      {sayfa < sayfaSayisi ? (
        <Link href={adres(sayfa + 1)} className={baglanti}>
          Sonraki sayfa
        </Link>
      ) : (
        <span />
      )}
    </nav>
  );
}
