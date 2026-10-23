'use client';

import { createContext, useContext, useMemo, useSyncExternalStore } from 'react';
import * as islem from '@/lib/sepet';
import { SepetKalemi } from '@/lib/sepet';

const ANAHTAR = 'raf-sepet';

// localStorage, React'in dışındaki bir veri kaynağıdır. useSyncExternalStore onu React'e bağlar:
// sunucuda ve ilk çizimde getServerSnapshot (null) kullanılır, tarayıcıda gerçek sepet okunur.
const dinleyiciler = new Set<() => void>();
let sonHam: string | null = null;
let sonSepet: SepetKalemi[] = [];

function abone(dinleyici: () => void) {
  dinleyiciler.add(dinleyici);
  // Başka bir sekmede sepet değişirse bu sekme de güncellenir
  const depolama = (e: StorageEvent) => e.key === ANAHTAR && dinleyici();
  window.addEventListener('storage', depolama);
  return () => {
    dinleyiciler.delete(dinleyici);
    window.removeEventListener('storage', depolama);
  };
}

function anlikGoruntu(): SepetKalemi[] {
  const ham = localStorage.getItem(ANAHTAR);
  // Aynı veri için aynı dizi döndürülmeli; yoksa React her seferinde değişti sanıp sonsuz döngüye girer
  if (ham !== sonHam) {
    sonHam = ham;
    sonSepet = islem.sepetiOku(ham);
  }
  return sonSepet;
}

function yaz(degistir: (s: SepetKalemi[]) => SepetKalemi[]) {
  localStorage.setItem(ANAHTAR, JSON.stringify(degistir(anlikGoruntu())));
  dinleyiciler.forEach((d) => d());
}

interface SepetBaglami {
  sepet: SepetKalemi[];
  /** Tarayıcıda sepet okunana kadar false: sunucuda ve ilk çizimde sepet boş görünür */
  hazir: boolean;
  ekle: (kitap: Omit<SepetKalemi, 'adet'>, adet?: number) => void;
  adetDegistir: (kitapId: number, adet: number) => void;
  cikar: (kitapId: number) => void;
  temizle: () => void;
}

const Baglam = createContext<SepetBaglami | null>(null);
const BOS: SepetKalemi[] = [];

export function SepetProvider({ children }: { children: React.ReactNode }) {
  const sepet = useSyncExternalStore(abone, anlikGoruntu, () => null);

  const deger = useMemo<SepetBaglami>(
    () => ({
      sepet: sepet ?? BOS,
      hazir: sepet !== null,
      ekle: (kitap, adet) => yaz((s) => islem.sepeteEkle(s, kitap, adet)),
      adetDegistir: (id, adet) => yaz((s) => islem.adetDegistir(s, id, adet)),
      cikar: (id) => yaz((s) => islem.sepettenCikar(s, id)),
      temizle: () => yaz(() => []),
    }),
    [sepet],
  );

  return <Baglam.Provider value={deger}>{children}</Baglam.Provider>;
}

export function useSepet(): SepetBaglami {
  const baglam = useContext(Baglam);
  if (!baglam) throw new Error('useSepet, SepetProvider içinde kullanılmalı');
  return baglam;
}
