import { Kitap, KitapGuncelle, KitapOlustur } from '../src/kitaplar/kitap';
import { KitapRepository } from '../src/kitaplar/kitapRepository';

/** Testler için PostgreSQL yerine bellekte çalışan repository. */
export class BellekKitapRepository implements KitapRepository {
  private kitaplar: Kitap[] = [];
  private sonId = 0;

  async listele(arama?: string) {
    if (!arama) return [...this.kitaplar];
    const a = arama.toLocaleLowerCase('tr');
    return this.kitaplar.filter(
      (k) => k.isim.toLocaleLowerCase('tr').includes(a) || k.yazar.toLocaleLowerCase('tr').includes(a),
    );
  }

  async getir(id: number) {
    return this.kitaplar.find((k) => k.id === id) ?? null;
  }

  async ekle(veri: KitapOlustur) {
    const kitap = { id: ++this.sonId, ...veri };
    this.kitaplar.push(kitap);
    return kitap;
  }

  async guncelle(id: number, veri: KitapGuncelle) {
    const kitap = await this.getir(id);
    if (!kitap) return null;
    Object.assign(kitap, Object.fromEntries(Object.entries(veri).filter(([, v]) => v !== undefined)));
    return kitap;
  }

  async sil(id: number) {
    const once = this.kitaplar.length;
    this.kitaplar = this.kitaplar.filter((k) => k.id !== id);
    return this.kitaplar.length < once;
  }

  async sat(id: number, adet: number) {
    const kitap = await this.getir(id);
    if (!kitap || kitap.stok < adet) return null;
    kitap.stok -= adet;
    return kitap;
  }
}
