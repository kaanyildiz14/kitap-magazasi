CREATE TABLE IF NOT EXISTS kitaplar (
  id         SERIAL PRIMARY KEY,
  isim       TEXT           NOT NULL,
  yazar      TEXT           NOT NULL,
  fiyat      NUMERIC(10, 2) NOT NULL CHECK (fiyat >= 0),
  stok       INTEGER        NOT NULL DEFAULT 0 CHECK (stok >= 0),
  olusturulma TIMESTAMPTZ   NOT NULL DEFAULT now()
);

INSERT INTO kitaplar (isim, yazar, fiyat, stok)
SELECT * FROM (VALUES
  ('Kürk Mantolu Madonna', 'Sabahattin Ali', 145.00, 12),
  ('Tutunamayanlar',       'Oğuz Atay',      320.00, 5),
  ('İnce Memed',           'Yaşar Kemal',    210.00, 8),
  ('Saatleri Ayarlama Enstitüsü', 'Ahmet Hamdi Tanpınar', 185.00, 0)
) AS v(isim, yazar, fiyat, stok)
WHERE NOT EXISTS (SELECT 1 FROM kitaplar);
