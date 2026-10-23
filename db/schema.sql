-- Kitap Mağazası şeması. Tekrar çalıştırılabilir (IF NOT EXISTS); mevcut veriyi silmez.
-- Tasarım gerekçeleri: docs/mimari.md → Veri Modeli

CREATE TABLE IF NOT EXISTS kullanicilar (
  id          SERIAL PRIMARY KEY,
  ad          TEXT        NOT NULL,
  eposta      TEXT        NOT NULL UNIQUE,
  sifre_hash  TEXT        NOT NULL,
  rol         TEXT        NOT NULL DEFAULT 'musteri' CHECK (rol IN ('musteri', 'admin')),
  olusturulma TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS kitaplar (
  id          SERIAL PRIMARY KEY,
  isim        TEXT           NOT NULL,
  yazar       TEXT           NOT NULL,
  fiyat       NUMERIC(10, 2) NOT NULL CHECK (fiyat >= 0),
  stok        INTEGER        NOT NULL DEFAULT 0 CHECK (stok >= 0),
  olusturulma TIMESTAMPTZ    NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS siparisler (
  id           SERIAL PRIMARY KEY,
  kullanici_id INTEGER        NOT NULL REFERENCES kullanicilar (id),
  toplam       NUMERIC(10, 2) NOT NULL CHECK (toplam >= 0),
  durum        TEXT           NOT NULL DEFAULT 'hazirlaniyor'
               CHECK (durum IN ('hazirlaniyor', 'kargoda', 'teslim_edildi', 'iptal')),
  olusturulma  TIMESTAMPTZ    NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS siparis_kalemleri (
  id          SERIAL PRIMARY KEY,
  siparis_id  INTEGER        NOT NULL REFERENCES siparisler (id) ON DELETE CASCADE,
  kitap_id    INTEGER        NOT NULL REFERENCES kitaplar (id),
  adet        INTEGER        NOT NULL CHECK (adet > 0),
  -- Sipariş anındaki fiyat: kitabın fiyatı sonradan değişse de sipariş tutarı değişmez
  birim_fiyat NUMERIC(10, 2) NOT NULL CHECK (birim_fiyat >= 0)
);

CREATE INDEX IF NOT EXISTS siparisler_kullanici_idx ON siparisler (kullanici_id);
CREATE INDEX IF NOT EXISTS siparis_kalemleri_siparis_idx ON siparis_kalemleri (siparis_id);

INSERT INTO kitaplar (isim, yazar, fiyat, stok)
SELECT * FROM (VALUES
  ('Kürk Mantolu Madonna', 'Sabahattin Ali', 145.00, 12),
  ('Tutunamayanlar', 'Oğuz Atay', 320.00, 5),
  ('İnce Memed', 'Yaşar Kemal', 210.00, 8),
  ('Saatleri Ayarlama Enstitüsü', 'Ahmet Hamdi Tanpınar', 185.00, 0),
  ('Masumiyet Müzesi', 'Orhan Pamuk', 260.00, 6),
  ('Aylak Adam', 'Yusuf Atılgan', 120.00, 9),
  ('Çalıkuşu', 'Reşat Nuri Güntekin', 175.00, 4),
  ('Yaban', 'Yakup Kadri Karaosmanoğlu', 140.00, 7)
) AS v(isim, yazar, fiyat, stok)
WHERE NOT EXISTS (SELECT 1 FROM kitaplar);
