import { DatabaseError, Pool } from 'pg';
import { Kullanici, KullaniciKaydi, Rol } from './kullanici';

export interface YeniKullanici {
  ad: string;
  eposta: string;
  sifreHash: string;
  rol: Rol;
}

export interface KullaniciRepository {
  /** E-posta zaten kayıtlıysa null döner. */
  ekle(veri: YeniKullanici): Promise<Kullanici | null>;
  epostaIleGetir(eposta: string): Promise<KullaniciKaydi | null>;
  getir(id: number): Promise<Kullanici | null>;
}

const KOLONLAR = 'id, ad, eposta, rol';

export class PgKullaniciRepository implements KullaniciRepository {
  constructor(private readonly pool: Pool) {}

  async ekle({ ad, eposta, sifreHash, rol }: YeniKullanici): Promise<Kullanici | null> {
    try {
      const { rows } = await this.pool.query<Kullanici>(
        `INSERT INTO kullanicilar (ad, eposta, sifre_hash, rol) VALUES ($1, $2, $3, $4) RETURNING ${KOLONLAR}`,
        [ad, eposta, sifreHash, rol],
      );
      return rows[0];
    } catch (err) {
      // 23505 = unique_violation: bu e-posta zaten kayıtlı
      if (err instanceof DatabaseError && err.code === '23505') return null;
      throw err;
    }
  }

  async epostaIleGetir(eposta: string): Promise<KullaniciKaydi | null> {
    const { rows } = await this.pool.query<KullaniciKaydi>(
      `SELECT ${KOLONLAR}, sifre_hash AS "sifreHash" FROM kullanicilar WHERE eposta = $1`,
      [eposta],
    );
    return rows[0] ?? null;
  }

  async getir(id: number): Promise<Kullanici | null> {
    const { rows } = await this.pool.query<Kullanici>(`SELECT ${KOLONLAR} FROM kullanicilar WHERE id = $1`, [id]);
    return rows[0] ?? null;
  }
}
