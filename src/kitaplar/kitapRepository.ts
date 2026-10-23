import { Pool } from 'pg';
import { Kitap, KitapGuncelle, KitapOlustur } from './kitap';

export interface KitapRepository {
  listele(arama?: string): Promise<Kitap[]>;
  getir(id: number): Promise<Kitap | null>;
  ekle(veri: KitapOlustur): Promise<Kitap>;
  guncelle(id: number, veri: KitapGuncelle): Promise<Kitap | null>;
  sil(id: number): Promise<boolean>;
  /** Stok yeterliyse düşer ve güncel kitabı döner; yetersizse null döner. */
  sat(id: number, adet: number): Promise<Kitap | null>;
}

const KOLONLAR = 'id, isim, yazar, fiyat::float AS fiyat, stok';

export class PgKitapRepository implements KitapRepository {
  constructor(private readonly pool: Pool) {}

  async listele(arama?: string): Promise<Kitap[]> {
    if (arama) {
      const { rows } = await this.pool.query<Kitap>(
        `SELECT ${KOLONLAR} FROM kitaplar WHERE isim ILIKE $1 OR yazar ILIKE $1 ORDER BY id`,
        [`%${arama}%`],
      );
      return rows;
    }
    const { rows } = await this.pool.query<Kitap>(`SELECT ${KOLONLAR} FROM kitaplar ORDER BY id`);
    return rows;
  }

  async getir(id: number): Promise<Kitap | null> {
    const { rows } = await this.pool.query<Kitap>(`SELECT ${KOLONLAR} FROM kitaplar WHERE id = $1`, [id]);
    return rows[0] ?? null;
  }

  async ekle(veri: KitapOlustur): Promise<Kitap> {
    const { rows } = await this.pool.query<Kitap>(
      `INSERT INTO kitaplar (isim, yazar, fiyat, stok) VALUES ($1, $2, $3, $4) RETURNING ${KOLONLAR}`,
      [veri.isim, veri.yazar, veri.fiyat, veri.stok],
    );
    return rows[0];
  }

  async guncelle(id: number, veri: KitapGuncelle): Promise<Kitap | null> {
    const { rows } = await this.pool.query<Kitap>(
      `UPDATE kitaplar SET
         isim  = COALESCE($2, isim),
         yazar = COALESCE($3, yazar),
         fiyat = COALESCE($4, fiyat),
         stok  = COALESCE($5, stok)
       WHERE id = $1 RETURNING ${KOLONLAR}`,
      [id, veri.isim ?? null, veri.yazar ?? null, veri.fiyat ?? null, veri.stok ?? null],
    );
    return rows[0] ?? null;
  }

  async sil(id: number): Promise<boolean> {
    const { rowCount } = await this.pool.query('DELETE FROM kitaplar WHERE id = $1', [id]);
    return (rowCount ?? 0) > 0;
  }

  async sat(id: number, adet: number): Promise<Kitap | null> {
    // Tek sorguda kontrol + güncelleme: eşzamanlı satışlarda stok eksiye düşmez
    const { rows } = await this.pool.query<Kitap>(
      `UPDATE kitaplar SET stok = stok - $2 WHERE id = $1 AND stok >= $2 RETURNING ${KOLONLAR}`,
      [id, adet],
    );
    return rows[0] ?? null;
  }
}
