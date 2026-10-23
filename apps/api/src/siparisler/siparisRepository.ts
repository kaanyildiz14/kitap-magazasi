import { Pool, PoolClient } from 'pg';
import { IstenenKalem, Siparis, SiparisDurumu, SiparisSonucu, toplamHesapla } from './siparis';

export interface SiparisRepository {
  olustur(kullaniciId: number, kalemler: IstenenKalem[]): Promise<SiparisSonucu>;
  /** kullaniciId verilmezse tüm siparişler (admin görünümü). */
  listele(kullaniciId?: number): Promise<Siparis[]>;
  getir(id: number): Promise<Siparis | null>;
  durumGuncelle(id: number, durum: SiparisDurumu): Promise<Siparis | null>;
}

const SIPARIS_SORGUSU = `
  SELECT s.id, s.kullanici_id AS "kullaniciId", s.toplam::float AS toplam, s.durum, s.olusturulma,
         json_agg(json_build_object(
           'kitapId', k.kitap_id, 'kitapIsim', kt.isim, 'adet', k.adet, 'birimFiyat', k.birim_fiyat::float
         ) ORDER BY k.id) AS kalemler
  FROM siparisler s
  JOIN siparis_kalemleri k ON k.siparis_id = s.id
  JOIN kitaplar kt ON kt.id = k.kitap_id`;

type SiparisSatiri = Omit<Siparis, 'olusturulma'> & { olusturulma: Date };
const donustur = (s: SiparisSatiri): Siparis => ({ ...s, olusturulma: s.olusturulma.toISOString() });

export class PgSiparisRepository implements SiparisRepository {
  constructor(private readonly pool: Pool) {}

  async olustur(kullaniciId: number, kalemler: IstenenKalem[]): Promise<SiparisSonucu> {
    const client = await this.pool.connect();
    let sonuc: Awaited<ReturnType<typeof this.transactionIcinde>>;
    try {
      await client.query('BEGIN');
      sonuc = await this.transactionIcinde(client, kullaniciId, kalemler);
      await client.query(sonuc.tur === 'tamam' ? 'COMMIT' : 'ROLLBACK');
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      // Bağlantı, siparişi okumadan ÖNCE havuza geri verilmeli: aksi halde yoğun anda her istek
      // bir bağlantı tutup ikincisini beklerken havuz tükenir ve hepsi birbirini bekler.
      client.release();
    }
    if (sonuc.tur !== 'tamam') return sonuc;
    return { tur: 'tamam', siparis: (await this.getir(sonuc.siparisId))! };
  }

  private async transactionIcinde(
    client: PoolClient,
    kullaniciId: number,
    kalemler: IstenenKalem[],
  ): Promise<Exclude<SiparisSonucu, { tur: 'tamam' }> | { tur: 'tamam'; siparisId: number }> {
    // 1) Kitap satırlarını kilitle. Aynı anda gelen başka bir sipariş bu satırlar için bekler.
    //    Kilitler hep id sırasıyla alınır; iki sipariş birbirini sonsuza kadar beklemez (deadlock).
    const { rows: kitaplar } = await client.query<{ id: number; fiyat: number; stok: number }>(
      'SELECT id, fiyat::float AS fiyat, stok FROM kitaplar WHERE id = ANY($1::int[]) ORDER BY id FOR UPDATE',
      [kalemler.map((k) => k.kitapId)],
    );
    const kitapMap = new Map(kitaplar.map((k) => [k.id, k]));

    // 2) Stok kontrolü: biri bile yetersizse sipariş hiç oluşmaz
    for (const { kitapId, adet } of kalemler) {
      const kitap = kitapMap.get(kitapId);
      if (!kitap) return { tur: 'kitap_yok', kitapId };
      if (kitap.stok < adet) return { tur: 'yetersiz_stok', kitapId, mevcut: kitap.stok };
    }

    // 3) Stokları düş, siparişi ve kalemleri yaz
    const ids = kalemler.map((k) => k.kitapId);
    const adetler = kalemler.map((k) => k.adet);
    const fiyatlar = kalemler.map((k) => kitapMap.get(k.kitapId)!.fiyat);

    await client.query(
      `UPDATE kitaplar SET stok = stok - v.adet
       FROM unnest($1::int[], $2::int[]) AS v(id, adet) WHERE kitaplar.id = v.id`,
      [ids, adetler],
    );
    const toplam = toplamHesapla(kalemler.map((k, i) => ({ adet: k.adet, birimFiyat: fiyatlar[i] })));
    const { rows } = await client.query<{ id: number }>(
      'INSERT INTO siparisler (kullanici_id, toplam) VALUES ($1, $2) RETURNING id',
      [kullaniciId, toplam],
    );
    await client.query(
      `INSERT INTO siparis_kalemleri (siparis_id, kitap_id, adet, birim_fiyat)
       SELECT $1::int, * FROM unnest($2::int[], $3::int[], $4::numeric[])`,
      [rows[0].id, ids, adetler, fiyatlar],
    );
    return { tur: 'tamam', siparisId: rows[0].id };
  }

  async listele(kullaniciId?: number): Promise<Siparis[]> {
    const { rows } = await this.pool.query<SiparisSatiri>(
      `${SIPARIS_SORGUSU} WHERE $1::int IS NULL OR s.kullanici_id = $1 GROUP BY s.id ORDER BY s.id DESC`,
      [kullaniciId ?? null],
    );
    return rows.map(donustur);
  }

  async getir(id: number): Promise<Siparis | null> {
    const { rows } = await this.pool.query<SiparisSatiri>(`${SIPARIS_SORGUSU} WHERE s.id = $1 GROUP BY s.id`, [id]);
    return rows[0] ? donustur(rows[0]) : null;
  }

  async durumGuncelle(id: number, durum: SiparisDurumu): Promise<Siparis | null> {
    const { rowCount } = await this.pool.query('UPDATE siparisler SET durum = $2 WHERE id = $1', [id, durum]);
    return rowCount ? this.getir(id) : null;
  }
}
