'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const SEKMELER = [
  { href: '/admin', ad: 'Kitaplar' },
  { href: '/admin/siparisler', ad: 'Siparişler' },
];

export function AdminSekmeleri() {
  const yol = usePathname();
  return (
    <nav aria-label="Yönetim bölümleri" className="mt-6 mb-8 flex gap-6 border-b border-cizgi">
      {SEKMELER.map((s) => (
        <Link
          key={s.href}
          href={s.href}
          aria-current={yol === s.href ? 'page' : undefined}
          className="-mb-px border-b-2 border-transparent pb-3 text-murekkep-soluk hover:text-murekkep aria-[current=page]:border-murekkep aria-[current=page]:font-bold aria-[current=page]:text-murekkep"
        >
          {s.ad}
        </Link>
      ))}
    </nav>
  );
}
