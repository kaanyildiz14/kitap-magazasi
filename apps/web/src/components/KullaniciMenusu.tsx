import Link from 'next/link';
import { cikisYap } from '@/actions/auth';
import { aktifKullanici } from '@/lib/oturum';

export async function KullaniciMenusu() {
  const kullanici = await aktifKullanici();
  if (!kullanici) {
    return (
      <Link href="/giris" className="hover:underline underline-offset-4">
        Giriş yap
      </Link>
    );
  }
  return (
    <>
      {kullanici.rol === 'admin' && (
        <Link href="/admin" className="hover:underline underline-offset-4">
          Yönetim
        </Link>
      )}
      <Link href="/siparisler" className="hover:underline underline-offset-4">
        Siparişlerim
      </Link>
      <form action={cikisYap}>
        <button className="text-murekkep-soluk hover:text-murekkep hover:underline underline-offset-4">
          Çıkış ({kullanici.ad.split(' ')[0]})
        </button>
      </form>
    </>
  );
}
