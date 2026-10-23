# 📚 Kitap Mağazası API

[![CI](https://github.com/kaanyildiz14/kitap-magazasi-api/actions/workflows/ci.yml/badge.svg)](https://github.com/kaanyildiz14/kitap-magazasi-api/actions/workflows/ci.yml)
![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?logo=typescript&logoColor=white)
![Express](https://img.shields.io/badge/Express_5-000000?logo=express&logoColor=white)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-4169E1?logo=postgresql&logoColor=white)
![Lisans](https://img.shields.io/badge/lisans-MIT-green)

Bir kitap mağazasının stok ve satış işlemlerini yöneten REST API. Express 5 ve TypeScript ile yazıldı, veriler PostgreSQL'de tutuluyor.

## ✨ Özellikler

- Kitaplar için tam **CRUD** (listeleme, arama, ekleme, kısmi güncelleme, silme)
- **Güvenli satış:** Stok kontrolü ve düşme işlemi tek bir atomik SQL sorgusunda yapılır, eşzamanlı isteklerde stok eksiye düşmez
- **Doğrulama:** [Zod](https://zod.dev) ile istek gövdesi ve parametre doğrulama, alan bazlı hata mesajları
- **Katmanlı mimari:** Router → Repository arayüzü → PostgreSQL. Testler veritabanı olmadan bellekte çalışır
- Merkezi hata yönetimi ve tutarlı JSON hata formatı
- Docker Compose ile tek komutla veritabanı kurulumu
- GitHub Actions ile her push'ta tip kontrolü, test ve build

## 🔌 API Uç Noktaları

| Metot | Yol | Açıklama |
|---|---|---|
| `GET` | `/health` | Sağlık kontrolü |
| `GET` | `/api/kitaplar?arama=` | Kitapları listeler (isim/yazara göre arama) |
| `GET` | `/api/kitaplar/:id` | Tek kitap |
| `POST` | `/api/kitaplar` | Yeni kitap ekler |
| `PATCH` | `/api/kitaplar/:id` | Kitabı kısmen günceller |
| `DELETE` | `/api/kitaplar/:id` | Kitabı siler |
| `POST` | `/api/kitaplar/:id/satis` | Satış yapar ve stoktan düşer (`{ "adet": 2 }`, varsayılan 1) |

### Örnek

```bash
curl -X POST http://localhost:3000/api/kitaplar \
  -H "Content-Type: application/json" \
  -d '{"isim": "Masumiyet Müzesi", "yazar": "Orhan Pamuk", "fiyat": 250, "stok": 4}'
```

```json
{ "id": 5, "isim": "Masumiyet Müzesi", "yazar": "Orhan Pamuk", "fiyat": 250, "stok": 4 }
```

Hata yanıtları:

| Durum | Ne zaman | Örnek gövde |
|---|---|---|
| `400` | Geçersiz veri | `{ "hata": "Geçersiz istek", "detaylar": [{ "alan": "fiyat", "mesaj": "Fiyat negatif olamaz" }] }` |
| `404` | Kitap yok | `{ "hata": "Kitap bulunamadı" }` |
| `409` | Stok yetersiz | `{ "hata": "Yetersiz stok" }` |

## 🚀 Kurulum

Gereksinimler: Node.js 22+, Docker (veya yerel PostgreSQL)

```bash
git clone https://github.com/kaanyildiz14/kitap-magazasi-api.git
cd kitap-magazasi-api
npm install
cp .env.example .env
docker compose up -d      # PostgreSQL'i başlatır, tabloyu ve örnek verileri oluşturur
npm run dev               # http://localhost:3000
```

Yerel PostgreSQL kullanıyorsan `.env` içindeki `DATABASE_URL`'i düzenle ve şemayı yükle:

```bash
psql "$DATABASE_URL" -f db/schema.sql
```

## 📜 Komutlar

| Komut | Açıklama |
|---|---|
| `npm run dev` | Geliştirme sunucusu (otomatik yeniden başlatma) |
| `npm test` | Testleri çalıştırır (Vitest + Supertest) |
| `npm run typecheck` | TypeScript tip kontrolü |
| `npm run build` | `dist/` klasörüne derler |
| `npm start` | Derlenmiş sürümü çalıştırır |

## 📁 Proje Yapısı

```
src/
├── server.ts                  # Giriş noktası: env, veritabanı bağlantısı
├── app.ts                     # Express uygulaması (testlerde de kullanılır)
├── kitaplar/
│   ├── kitap.ts               # Tipler ve Zod şemaları
│   ├── kitapRepository.ts     # Repository arayüzü + PostgreSQL uygulaması
│   └── kitapRouter.ts         # HTTP uç noktaları
└── middleware/
    └── hataYakalayici.ts      # Merkezi hata yönetimi
tests/                         # Bellek içi repository ile API testleri
db/schema.sql                  # Tablo ve örnek veriler
```

## 🗺️ Yol Haritası

- [ ] JWT ile kimlik doğrulama (admin / müşteri rolleri)
- [ ] Sayfalama
- [ ] OpenAPI / Swagger dokümantasyonu
- [ ] Sipariş geçmişi tablosu

## 📄 Lisans

[MIT](LICENSE)
