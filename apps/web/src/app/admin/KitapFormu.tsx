'use client';

import { useActionState, useEffect, useRef } from 'react';
import { kitapKaydet } from '@/actions/admin';
import { FormAlani, FormMesaji } from '@/components/FormAlani';
import { FormDurumu, Kitap } from '@/lib/tipler';

/** Kitap yoksa yeni kitap ekler, varsa onu düzenler. */
export function KitapFormu({ kitap, onKaydedildi }: { kitap?: Kitap; onKaydedildi?: () => void }) {
  const [durum, eylem, bekliyor] = useActionState<FormDurumu, FormData>(kitapKaydet, {});
  const form = useRef<HTMLFormElement>(null);
  const h = durum.alanHatalari ?? {};
  // Hata varsa kullanıcının yazdıkları, yoksa kitabın mevcut değerleri
  const d = durum.degerler ?? {
    isim: kitap?.isim ?? '',
    yazar: kitap?.yazar ?? '',
    fiyat: kitap ? String(kitap.fiyat) : '',
    stok: String(kitap?.stok ?? 0),
  };

  useEffect(() => {
    if (!durum.mesaj) return;
    if (kitap) onKaydedildi?.();
    else form.current?.reset();
  }, [durum, kitap, onKaydedildi]);

  const on = kitap ? `k${kitap.id}-` : '';
  return (
    <form ref={form} action={eylem} className="flex flex-col gap-4" noValidate>
      {kitap && <input type="hidden" name="id" value={kitap.id} />}
      <div className="grid gap-4 sm:grid-cols-[2fr_2fr_1fr_1fr]">
        <FormAlani etiket="Kitap adı" name="isim" id={`${on}isim`} defaultValue={d.isim} required hata={h.isim} />
        <FormAlani etiket="Yazar" name="yazar" id={`${on}yazar`} defaultValue={d.yazar} required hata={h.yazar} />
        <FormAlani
          etiket="Fiyat (TL)"
          name="fiyat"
          id={`${on}fiyat`}
          inputMode="decimal"
          defaultValue={d.fiyat}
          required
          hata={h.fiyat}
        />
        <FormAlani etiket="Stok" name="stok" id={`${on}stok`} inputMode="numeric" defaultValue={d.stok} hata={h.stok} />
      </div>
      <div className="flex flex-wrap items-center gap-4">
        <button
          disabled={bekliyor}
          className="rounded-full bg-eylem px-6 py-2.5 font-bold text-white hover:bg-eylem-koyu disabled:opacity-60"
        >
          {kitap ? (bekliyor ? 'Kaydediliyor…' : 'Değişiklikleri kaydet') : bekliyor ? 'Ekleniyor…' : 'Kitabı ekle'}
        </button>
        {kitap && (
          <button type="button" onClick={onKaydedildi} className="text-murekkep-soluk underline underline-offset-4">
            Vazgeç
          </button>
        )}
      </div>
      <FormMesaji hata={Object.keys(h).length ? undefined : durum.hata} mesaj={kitap ? undefined : durum.mesaj} />
    </form>
  );
}
