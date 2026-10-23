import { Suspense } from 'react';
import { adminGerekli } from '@/lib/sayfaKorumasi';
import { AdminSekmeleri } from './AdminSekmeleri';

export default function AdminDuzeni({ children }: { children: React.ReactNode }) {
  return (
    <div className="mx-auto max-w-6xl px-4 sm:px-6 py-12">
      <Suspense fallback={<p className="text-murekkep-soluk">Yükleniyor…</p>}>
        <AdminKorumasi>{children}</AdminKorumasi>
      </Suspense>
    </div>
  );
}

/** Yetkisiz biri yönetim panelinin iskeletini (başlık, sekmeler) hiç görmez. */
async function AdminKorumasi({ children }: { children: React.ReactNode }) {
  await adminGerekli('/admin');
  return (
    <>
      <h1 className="text-4xl font-semibold">Yönetim</h1>
      <AdminSekmeleri />
      {children}
    </>
  );
}
