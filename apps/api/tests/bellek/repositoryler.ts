// Testler için PostgreSQL yerine bellekte çalışan repository'ler.
// Aynı arayüzleri uyguladıkları için API kodu farkı anlamaz.
import { Kullanici, KullaniciKaydi } from '../../src/auth/kullanici';
import { KullaniciRepository, YeniKullanici } from '../../src/auth/kullaniciRepository';
import { Kitap, KitapGuncelle, KitapListeSorgusu, KitapOlustur, Sayfa } from '../../src/kitaplar/kitap';
import { KitapRepository, SilmeSonucu } from '../../src/kitaplar/kitapRepository';
import { IstenenKalem, Siparis, SiparisDurumu, SiparisSonucu, toplamHesapla } from '../../src/siparisler/siparis';
import { SiparisRepository } from '../../src/siparisler/siparisRepository';

/** Üç repository'nin paylaştığı "veritabanı": sipariş verilince kitap stokları düşebilsin. */
export class BellekVeri {
  kitaplar: Kitap[] = [];
  kullanicilar: KullaniciKaydi[] = [];
  siparisler: Siparis[] = [];
}

const kopya = <T>(x: T): T => structuredClone(x);

export class BellekKitapRepository implements KitapRepository {
  private sonId = 0;
  constructor(private readonly veri: BellekVeri) {}

  async listele({ arama, sayfa, limit }: KitapListeSorgusu): Promise<Sayfa<Kitap>> {
    const a = arama?.toLocaleLowerCase('tr');
    const eslesen = this.veri.kitaplar.filter(
      (k) => !a || k.isim.toLocaleLowerCase('tr').includes(a) || k.yazar.toLocaleLowerCase('tr').includes(a),
    );
    return { veriler: kopya(eslesen.slice((sayfa - 1) * limit, sayfa * limit)), toplam: eslesen.length, sayfa, limit };
  }

  async getir(id: number) {
    const kitap = this.veri.kitaplar.find((k) => k.id === id);
    return kitap ? kopya(kitap) : null;
  }

  async ekle(veri: KitapOlustur) {
    const kitap = { id: ++this.sonId, ...veri };
    this.veri.kitaplar.push(kitap);
    return kopya(kitap);
  }

  async guncelle(id: number, degisiklik: KitapGuncelle) {
    const kitap = this.veri.kitaplar.find((k) => k.id === id);
    if (!kitap) return null;
    for (const [alan, deger] of Object.entries(degisiklik)) {
      if (deger !== undefined) Object.assign(kitap, { [alan]: deger });
    }
    return kopya(kitap);
  }

  async sil(id: number): Promise<SilmeSonucu> {
    if (!this.veri.kitaplar.some((k) => k.id === id)) return 'bulunamadi';
    if (this.veri.siparisler.some((s) => s.kalemler.some((k) => k.kitapId === id))) return 'siparisi_var';
    this.veri.kitaplar = this.veri.kitaplar.filter((k) => k.id !== id);
    return 'silindi';
  }
}

export class BellekKullaniciRepository implements KullaniciRepository {
  private sonId = 0;
  constructor(private readonly veri: BellekVeri) {}

  async ekle({ ad, eposta, sifreHash, rol }: YeniKullanici): Promise<Kullanici | null> {
    if (this.veri.kullanicilar.some((k) => k.eposta === eposta)) return null;
    const kayit = { id: ++this.sonId, ad, eposta, rol, sifreHash };
    this.veri.kullanicilar.push(kayit);
    return { id: kayit.id, ad, eposta, rol };
  }

  async epostaIleGetir(eposta: string) {
    const kayit = this.veri.kullanicilar.find((k) => k.eposta === eposta);
    return kayit ? kopya(kayit) : null;
  }

  async getir(id: number) {
    const kayit = this.veri.kullanicilar.find((k) => k.id === id);
    return kayit ? { id: kayit.id, ad: kayit.ad, eposta: kayit.eposta, rol: kayit.rol } : null;
  }
}

export class BellekSiparisRepository implements SiparisRepository {
  private sonId = 0;
  constructor(private readonly veri: BellekVeri) {}

  async olustur(kullaniciId: number, kalemler: IstenenKalem[]): Promise<SiparisSonucu> {
    // Önce hepsini kontrol et, sonra değiştir: PostgreSQL'deki transaction'ın "ya hep ya hiç" davranışı
    for (const { kitapId, adet } of kalemler) {
      const kitap = this.veri.kitaplar.find((k) => k.id === kitapId);
      if (!kitap) return { tur: 'kitap_yok', kitapId };
      if (kitap.stok < adet) return { tur: 'yetersiz_stok', kitapId, mevcut: kitap.stok };
    }
    const siparisKalemleri = kalemler.map(({ kitapId, adet }) => {
      const kitap = this.veri.kitaplar.find((k) => k.id === kitapId)!;
      kitap.stok -= adet;
      return { kitapId, kitapIsim: kitap.isim, adet, birimFiyat: kitap.fiyat };
    });
    const siparis: Siparis = {
      id: ++this.sonId,
      kullaniciId,
      toplam: toplamHesapla(siparisKalemleri),
      durum: 'hazirlaniyor',
      olusturulma: new Date().toISOString(),
      kalemler: siparisKalemleri,
    };
    this.veri.siparisler.push(siparis);
    return { tur: 'tamam', siparis: kopya(siparis) };
  }

  async listele(kullaniciId?: number) {
    return kopya(this.veri.siparisler.filter((s) => kullaniciId === undefined || s.kullaniciId === kullaniciId).reverse());
  }

  async getir(id: number) {
    const siparis = this.veri.siparisler.find((s) => s.id === id);
    return siparis ? kopya(siparis) : null;
  }

  async durumGuncelle(id: number, durum: SiparisDurumu) {
    const siparis = this.veri.siparisler.find((s) => s.id === id);
    if (!siparis) return null;
    siparis.durum = durum;
    return kopya(siparis);
  }
}
