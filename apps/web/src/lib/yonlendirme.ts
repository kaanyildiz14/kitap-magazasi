/**
 * Girişten sonra dönülecek adres yalnızca site içi bir yol olabilir.
 * "//kotu-site.com" ya da "https://..." verilirse ana sayfaya dönülür (açık yönlendirme açığı).
 */
export function guvenliDonus(adres: unknown, varsayilan = '/'): string {
  if (typeof adres !== 'string' || !adres.startsWith('/') || adres.startsWith('//') || adres.includes('\\')) {
    return varsayilan;
  }
  return adres;
}
