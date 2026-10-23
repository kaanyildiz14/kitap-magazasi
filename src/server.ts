import { Pool } from 'pg';
import { createApp } from './app';
import { PgKitapRepository } from './kitaplar/kitapRepository';

try {
  process.loadEnvFile();
} catch {
  // .env dosyası yoksa ortam değişkenleri doğrudan kullanılır
}

const port = Number(process.env.PORT ?? 3000);
const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const app = createApp(new PgKitapRepository(pool));

app.listen(port, () => {
  console.log(`Kitap Mağazası API çalışıyor: http://localhost:${port}`);
});
