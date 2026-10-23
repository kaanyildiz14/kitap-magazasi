import Link from 'next/link';
import { cilt, sirtYaziBoyu } from '@/lib/kapak';
import { Kitap } from '@/lib/tipler';

/** Ana sayfanın imzası: kitaplar rafta sırtlarıyla dizili, her biri kendi rengi, boyu ve kalınlığıyla. */
export function Raf({ kitaplar }: { kitaplar: Kitap[] }) {
  return (
    <div className="relative">
      {/* Sığmayan kitaplar yana kaydırılır; sağ kenardaki solma devamı olduğunu gösterir */}
      <ul
        className="raf-dizisi flex items-end gap-[3px] overflow-x-auto overflow-y-hidden px-1 pt-6"
        aria-label="Raftaki kitaplar"
      >
        {kitaplar.map((kitap, i) => {
          const c = cilt(kitap);
          return (
            <li key={kitap.id} className="shrink-0">
              <Link
                href={`/kitap/${kitap.id}`}
                className="sirt relative flex flex-col items-center gap-2 rounded-t-[3px] pt-2 pb-3 shadow-[inset_-4px_0_6px_-4px_rgba(0,0,0,0.4),inset_3px_0_4px_-3px_rgba(255,255,255,0.25)]"
                style={{
                  width: c.kalinlik,
                  height: c.boy,
                  backgroundColor: c.zemin,
                  color: c.yazi,
                  animationDelay: `${i * 45}ms`,
                }}
                title={`${kitap.isim}, ${kitap.yazar}`}
              >
                {/* Sırtın üstündeki çift süs çizgisi */}
                <span className="flex w-full flex-col gap-[3px] px-1.5 opacity-60" aria-hidden>
                  <span className="h-px" style={{ backgroundColor: c.yazi }} />
                  <span className="h-[2px]" style={{ backgroundColor: c.yazi }} />
                </span>
                <span
                  className="sirt-yazisi flex-1 font-serif font-semibold leading-none whitespace-nowrap"
                  style={{ fontSize: sirtYaziBoyu(kitap.isim, c.boy) }}
                >
                  {kitap.isim}
                </span>
                <span className="sirt-yazisi text-[10px] opacity-80 whitespace-nowrap">{kitap.yazar.split(' ').at(-1)}</span>
                {kitap.stok === 0 && <span className="sr-only">(tükendi)</span>}
              </Link>
            </li>
          );
        })}
      </ul>
      {/* Rafın tahtası */}
      <div className="h-4 rounded-sm bg-raf shadow-[0_6px_10px_-6px_rgba(28,43,51,0.6)]" />
    </div>
  );
}
