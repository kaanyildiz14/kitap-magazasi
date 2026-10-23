import { z } from 'zod';

// Ortam değişkenleri uygulama başlarken bir kez doğrulanır: eksik/hatalı ayarla sunucu hiç açılmaz.
const sema = z.object({
  PORT: z.coerce.number().int().positive().default(3000),
  DATABASE_URL: z.string().min(1, 'DATABASE_URL gerekli'),
  JWT_SECRET: z.string().min(32, 'JWT_SECRET en az 32 karakter olmalı'),
});

export type Config = z.infer<typeof sema>;

export function configYukle(env: NodeJS.ProcessEnv = process.env): Config {
  const sonuc = sema.safeParse(env);
  if (!sonuc.success) {
    const hatalar = sonuc.error.issues.map((i) => `  - ${i.path.join('.')}: ${i.message}`).join('\n');
    throw new Error(`Ortam değişkenleri hatalı:\n${hatalar}`);
  }
  return sonuc.data;
}
