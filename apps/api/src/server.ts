import { Pool } from 'pg';
import { createApp } from './app';
import { PgKullaniciRepository } from './auth/kullaniciRepository';
import { TokenServisi } from './auth/token';
import { configYukle } from './config';
import { PgKitapRepository } from './kitaplar/kitapRepository';
import { PgSiparisRepository } from './siparisler/siparisRepository';

try {
  process.loadEnvFile();
} catch {
  // .env dosyası yoksa ortam değişkenleri doğrudan kullanılır
}

const config = configYukle();
const pool = new Pool({ connectionString: config.DATABASE_URL });

const app = createApp({
  kitaplar: new PgKitapRepository(pool),
  kullanicilar: new PgKullaniciRepository(pool),
  siparisler: new PgSiparisRepository(pool),
  tokenlar: new TokenServisi(config.JWT_SECRET),
});

app.listen(config.PORT, () => {
  console.log(`Kitap Mağazası API çalışıyor: http://localhost:${config.PORT}`);
});
