import { DatabaseError, Pool } from 'pg';
import { Kitap, KitapGuncelle, KitapListeSorgusu, KitapOlustur, Sayfa } from './kitap';

export type SilmeSonucu = 'silindi' | 'bulunamadi' | 'siparisi_var';

export interface KitapRepository {
  listele(sorgu: KitapListeSorgusu): Promise<Sayfa<Kitap>>;
  getir(id: number): Promise<Kitap | null>;
  ekle(veri: KitapOlustur): Promise<Kitap>;
  guncelle(id: number, veri: KitapGuncelle): Promise<Kitap | null>;
  sil(id: number): Promise<SilmeSonucu>;
}

const KOLONLAR = 'id, isim, yazar, fiyat::float AS fiyat, stok';

export class PgKitapRepository implements KitapRepository {
  constructor(private readonly pool: Pool) {}

  async listele({ arama, sayfa, limit }: KitapListeSorgusu): Promise<Sayfa<Kitap>> {
    // Arama yoksa $1 NULL olur ve koşul her satır için doğrudur
    const kosul = 'WHERE $1::text IS NULL OR isim ILIKE $1 OR yazar ILIKE $1';
    const desen = arama ? `%${arama}%` : null;
    const [veri, sayim] = await Promise.all([
      this.pool.query<Kitap>(`SELECT ${KOLONLAR} FROM kitaplar ${kosul} ORDER BY id LIMIT $2 OFFSET $3`, [
        desen,
        limit,
        (sayfa - 1) * limit,
      ]),
      this.pool.query<{ toplam: number }>(`SELECT count(*)::int AS toplam FROM kitaplar ${kosul}`, [desen]),
    ]);
    return { veriler: veri.rows, toplam: sayim.rows[0].toplam, sayfa, limit };
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

  async sil(id: number): Promise<SilmeSonucu> {
    try {
      const { rowCount } = await this.pool.query('DELETE FROM kitaplar WHERE id = $1', [id]);
      return rowCount ? 'silindi' : 'bulunamadi';
    } catch (err) {
      // 23503 = foreign_key_violation: kitap bir siparişte geçiyor, geçmiş siparişler bozulmasın
      if (err instanceof DatabaseError && err.code === '23503') return 'siparisi_var';
      throw err;
    }
  }
}
