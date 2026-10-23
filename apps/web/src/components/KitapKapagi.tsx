import { cilt } from '@/lib/kapak';
import { Kitap } from '@/lib/tipler';

/**
 * Kitabın ön kapağı: cildin rengi ve bandı, raftaki sırtla aynı.
 * boyut="kucuk": sepet gibi dar yerlerde yalnızca cilt gösterilir (yazı sığmaz, okunmaz).
 */
export function KitapKapagi({
  kitap,
  boyut = 'normal',
}: {
  kitap: Pick<Kitap, 'id' | 'isim' | 'yazar'>;
  boyut?: 'kucuk' | 'normal' | 'buyuk';
}) {
  const c = cilt(kitap);
  const buyuk = boyut === 'buyuk';
  return (
    <div
      className="relative aspect-[2/3] w-full overflow-hidden rounded-r-md rounded-l-sm shadow-[inset_6px_0_8px_-6px_rgba(0,0,0,0.45),0_1px_2px_rgba(28,43,51,0.25)]"
      style={{ backgroundColor: c.zemin, color: c.yazi }}
      aria-hidden
    >
      <div className="absolute inset-x-0 h-[3px] opacity-60" style={{ top: `${c.bant}%`, backgroundColor: c.yazi }} />
      {boyut !== 'kucuk' && (
        <div className={`absolute inset-x-0 top-[30%] flex flex-col gap-2 ${buyuk ? 'px-8' : 'px-4'}`}>
          <p
            className={`font-serif font-semibold leading-tight hyphens-auto [overflow-wrap:anywhere] ${buyuk ? 'text-3xl' : 'text-lg'}`}
          >
            {kitap.isim}
          </p>
          <p className={`opacity-80 ${buyuk ? 'text-lg' : 'text-xs'}`}>{kitap.yazar}</p>
        </div>
      )}
    </div>
  );
}
