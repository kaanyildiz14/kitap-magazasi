import { randomBytes, scrypt, timingSafeEqual } from 'node:crypto';
import { promisify } from 'node:util';

const scryptAsync = promisify(scrypt) as (sifre: string, salt: Buffer, uzunluk: number) => Promise<Buffer>;
const ANAHTAR_UZUNLUGU = 64;

// Saklanan biçim: "scrypt$<salt hex>$<hash hex>". Salt her şifre için rastgeledir,
// böylece aynı şifreyi kullanan iki kullanıcının hash'i farklı olur.
export async function sifreHashle(sifre: string): Promise<string> {
  const salt = randomBytes(16);
  const hash = await scryptAsync(sifre, salt, ANAHTAR_UZUNLUGU);
  return `scrypt$${salt.toString('hex')}$${hash.toString('hex')}`;
}

export async function sifreDogrula(sifre: string, saklanan: string): Promise<boolean> {
  const [algoritma, saltHex, hashHex] = saklanan.split('$');
  if (algoritma !== 'scrypt' || !saltHex || !hashHex) return false;
  const beklenen = Buffer.from(hashHex, 'hex');
  const hesaplanan = await scryptAsync(sifre, Buffer.from(saltHex, 'hex'), beklenen.length);
  // Sabit süreli karşılaştırma: yanıt süresinden şifre hakkında bilgi sızmaz
  return timingSafeEqual(hesaplanan, beklenen);
}
