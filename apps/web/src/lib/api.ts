import 'server-only';

// Tarayıcı API'ye hiç doğrudan gitmez: tüm istekler Next.js sunucusundan geçer (BFF deseni).
// Böylece token httpOnly çerezde kalır ve JavaScript ile çalınamaz; CORS da gerekmez.
const API_URL = process.env.API_URL ?? 'http://localhost:3000';

export type ApiSonucu<T> =
  | { ok: true; durum: number; veri: T }
  | { ok: false; durum: number; hata: string; detaylar?: { alan: string; mesaj: string }[] };

export async function apiIstek<T>(
  yol: string,
  { method = 'GET', govde, token }: { method?: string; govde?: unknown; token?: string } = {},
): Promise<ApiSonucu<T>> {
  let yanit: Response;
  try {
    yanit = await fetch(`${API_URL}/api${yol}`, {
      method,
      headers: {
        Accept: 'application/json',
        ...(govde !== undefined && { 'Content-Type': 'application/json' }),
        ...(token && { Authorization: `Bearer ${token}` }),
      },
      body: govde !== undefined ? JSON.stringify(govde) : undefined,
      cache: 'no-store',
    });
  } catch {
    return { ok: false, durum: 503, hata: 'Mağaza sunucusuna şu an ulaşılamıyor. Biraz sonra tekrar deneyin.' };
  }

  if (yanit.status === 204) return { ok: true, durum: 204, veri: undefined as T };
  const json = await yanit.json().catch(() => ({}));
  if (yanit.ok) return { ok: true, durum: yanit.status, veri: json as T };
  return { ok: false, durum: yanit.status, hata: json.hata ?? 'Beklenmeyen bir hata oluştu', detaylar: json.detaylar };
}

/** API'nin alan bazlı hatalarını form alanlarına eşler. */
export function alanHatalari(detaylar?: { alan: string; mesaj: string }[]): Record<string, string> | undefined {
  if (!detaylar?.length) return undefined;
  return Object.fromEntries(detaylar.map((d) => [d.alan, d.mesaj]));
}
