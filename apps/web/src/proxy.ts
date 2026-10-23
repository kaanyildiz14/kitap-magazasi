import { NextRequest, NextResponse } from 'next/server';
import { OTURUM_CEREZI } from '@/lib/oturum-sabitleri';

// İyimser kontrol: çerez hiç yoksa giriş sayfasına yönlendir. Token'ın geçerliliğini ve
// admin rolünü sayfalar (ve asıl olarak API) kontrol eder; proxy yetkilendirme yapmaz.
export function proxy(istek: NextRequest) {
  if (istek.cookies.has(OTURUM_CEREZI)) return NextResponse.next();
  const giris = new URL('/giris', istek.url);
  giris.searchParams.set('sonra', istek.nextUrl.pathname + istek.nextUrl.search);
  return NextResponse.redirect(giris);
}

export const config = {
  matcher: ['/siparisler/:path*', '/admin/:path*'],
};
