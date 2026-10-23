// Kullanım: npm run admin -w apps/api -- "Ad Soyad" admin@ornek.com "guclu-bir-sifre"
// Admin yalnızca sunucuya erişimi olan biri tarafından bu komutla oluşturulabilir; API'de böyle bir uç nokta yok.
import { Pool } from 'pg';
import { kayitSemasi } from '../auth/kullanici';
import { sifreHashle } from '../auth/sifre';

try {
  process.loadEnvFile();
} catch {
  // .env yoksa ortam değişkenleri kullanılır
}

const [ad, eposta, sifre] = process.argv.slice(2);
const sonuc = kayitSemasi.safeParse({ ad, eposta, sifre });
if (!sonuc.success) {
  console.error('Kullanım: npm run admin -w apps/api -- "Ad Soyad" eposta sifre');
  for (const hata of sonuc.error.issues) console.error(`  - ${hata.path.join('.')}: ${hata.message}`);
  process.exit(1);
}

async function main(veri: { ad: string; eposta: string; sifre: string }) {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  // Kullanıcı zaten varsa admin'e yükseltilir ve şifresi güncellenir
  const { rows } = await pool.query<{ id: number }>(
    `INSERT INTO kullanicilar (ad, eposta, sifre_hash, rol) VALUES ($1, $2, $3, 'admin')
     ON CONFLICT (eposta) DO UPDATE SET rol = 'admin', sifre_hash = EXCLUDED.sifre_hash
     RETURNING id`,
    [veri.ad, veri.eposta, await sifreHashle(veri.sifre)],
  );
  console.log(`Admin hazır: ${veri.eposta} (id: ${rows[0].id})`);
  await pool.end();
}

main(sonuc.data).catch((err) => {
  console.error(err);
  process.exit(1);
});
