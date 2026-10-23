# 📚 Kitap Mağazası

[![CI](https://github.com/kaanyildiz14/kitap-magazasi-api/actions/workflows/ci.yml/badge.svg)](https://github.com/kaanyildiz14/kitap-magazasi-api/actions/workflows/ci.yml)
![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?logo=typescript&logoColor=white)
![Express](https://img.shields.io/badge/Express_5-000000?logo=express&logoColor=white)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-4169E1?logo=postgresql&logoColor=white)
![Lisans](https://img.shields.io/badge/lisans-MIT-green)

Bir kitap mağazasının üyelik, katalog, stok ve sipariş süreçlerini yöneten full-stack uygulama. Bu repo şu an **REST API**'yi içeriyor; Next.js arayüzü yolda ([yol haritası](docs/mimari.md#aşamalar)).

> Projenin neden böyle kurulduğunu, her kararın gerekçesini ve alternatiflerini **[docs/mimari.md](docs/mimari.md)** anlatıyor.

## ✨ Öne Çıkanlar

- **Güvenli sipariş:** Çok kalemli sipariş tek transaction'da işlenir; satırlar `SELECT … FOR UPDATE` ile kilitlenir. Aynı anda gelen 20 siparişin stoğu eksiye düşürmediği gerçek PostgreSQL'e karşı test ediliyor.
- **Kimlik doğrulama:** `scrypt` ile hash'lenmiş şifreler, JWT, müşteri/admin rolleri, giriş denemelerine hız sınırı
- **Güvenlik detayları:** Fiyat istemciden alınmaz; başkasının siparişi için 404 döner; giriş hatası hangi alanın yanlış olduğunu söylemez; `helmet` başlıkları
- **Doğru para hesabı:** Veritabanında `NUMERIC`, uygulamada kuruş cinsinden toplama; sipariş anındaki fiyat ayrıca saklanır
- **Katmanlı mimari:** Router → Repository arayüzü → PostgreSQL. Birim testler veritabanı olmadan, entegrasyon testleri gerçek PostgreSQL ile çalışır
- **46 test**, her push'ta CI'da (tip kontrolü + testler + build)

## 🔌 API

Tüm uç noktalar `/api` altında, JSON alır ve döner. 🔒 giriş, 👑 admin gerektirir.

### Kimlik

| Metot | Yol | Açıklama |
|---|---|---|
| `POST` | `/auth/kayit` | Müşteri hesabı açar → `{ kullanici, token }` |
| `POST` | `/auth/giris` | Giriş → `{ kullanici, token }` |
| `GET` 🔒 | `/auth/ben` | Giriş yapmış kullanıcı |

Token, `Authorization: Bearer <token>` başlığıyla gönderilir.

### Kitaplar

| Metot | Yol | Açıklama |
|---|---|---|
| `GET` | `/kitaplar?arama=&sayfa=1&limit=20` | Sayfalı liste → `{ veriler, toplam, sayfa, limit }` |
| `GET` | `/kitaplar/:id` | Tek kitap |
| `POST` 👑 | `/kitaplar` | Kitap ekler |
| `PATCH` 👑 | `/kitaplar/:id` | Kısmi güncelleme |
| `DELETE` 👑 | `/kitaplar/:id` | Siler (siparişte geçiyorsa `409`) |

### Siparişler

| Metot | Yol | Açıklama |
|---|---|---|
| `POST` 🔒 | `/siparisler` | `{ "kalemler": [{ "kitapId": 1, "adet": 2 }] }` |
| `GET` 🔒 | `/siparisler` | Müşteri kendi siparişlerini, admin hepsini görür |
| `GET` 🔒 | `/siparisler/:id` | Tek sipariş (başkasınınsa `404`) |
| `PATCH` 👑 | `/siparisler/:id/durum` | `hazirlaniyor` · `kargoda` · `teslim_edildi` · `iptal` |

### Örnek akış

```bash
# Kayıt ol ve token'ı al
TOKEN=$(curl -s -X POST localhost:3000/api/auth/kayit -H 'Content-Type: application/json' \
  -d '{"ad":"Ayşe","eposta":"ayse@ornek.com","sifre":"guclu-sifre-1"}' | jq -r .token)

# Sipariş ver
curl -X POST localhost:3000/api/siparisler -H "Authorization: Bearer $TOKEN" \
  -H 'Content-Type: application/json' -d '{"kalemler":[{"kitapId":1,"adet":2}]}'
```

### Hatalar

Hepsi aynı biçimde: `{ "hata": "…", "detaylar"?: [{ "alan": "…", "mesaj": "…" }] }`

| Kod | Ne zaman |
|---|---|
| `400` | Doğrulama hatası (alan bazlı detaylarla) |
| `401` | Giriş yok / token geçersiz |
| `403` | Yetki yok |
| `404` | Kayıt yok |
| `409` | E-posta kayıtlı, stok yetersiz, kitap siparişte geçiyor |
| `429` | Çok fazla giriş denemesi |

## 🚀 Kurulum

Gereksinimler: Node.js 22+, Docker (veya yerel PostgreSQL)

```bash
git clone https://github.com/kaanyildiz14/kitap-magazasi-api.git
cd kitap-magazasi-api
npm install
cp apps/api/.env.example apps/api/.env
docker compose up -d                 # PostgreSQL + şema + örnek kitaplar
npm run dev:api                      # http://localhost:3000

# İlk admin kullanıcısı (API'de admin oluşturan bir uç nokta yok, bilerek)
npm run admin -w apps/api -- "Ad Soyad" admin@ornek.com "guclu-bir-sifre"
```

## 🧪 Testler

```bash
npm test                             # birim + API testleri (veritabanı gerekmez)

# Gerçek PostgreSQL'e karşı entegrasyon testleri (veritabanını SIFIRLAR, ayrı bir DB kullan)
createdb kitap_test
TEST_DATABASE_URL=postgres://localhost/kitap_test npm test
```

## 📁 Yapı

```
apps/api/
├── src/
│   ├── app.ts                 # Uygulama kurulumu (bağımlılıklar dışarıdan verilir)
│   ├── server.ts              # Giriş noktası: config, PostgreSQL, sunucu
│   ├── config.ts              # Ortam değişkenleri doğrulaması
│   ├── auth/                  # Şifre, JWT, yetki middleware'i, /auth uç noktaları
│   ├── kitaplar/              # Kitap modeli, repository, router
│   ├── siparisler/            # Transaction'lı sipariş oluşturma
│   ├── middleware/            # Merkezi hata yönetimi
│   └── scripts/               # Admin oluşturma komutu
└── tests/
    ├── bellek/                # Testler için bellek içi repository'ler
    ├── entegrasyon/           # Gerçek PostgreSQL testleri
    └── *.test.ts
db/schema.sql                  # Tablolar, kısıtlar, örnek veriler
docs/mimari.md                 # Mimari kararlar ve yol haritası
```

## 📄 Lisans

[MIT](LICENSE)
