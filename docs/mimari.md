# Mimari ve Yol Haritası

Bu doküman projenin **neden** böyle kurulduğunu anlatır. Kodu okurken "bu neden burada?" diye sorduğunda cevabı burada bulmalısın. Her karar kısa bir gerekçeyle yazıldı; ileride değiştirmek istersen neyi göze aldığını bilerek değiştirebilirsin.

## Amaç

Gerçek bir kitap mağazasının temel akışlarını uçtan uca gösteren, canlıda çalışan bir full-stack proje:

- Ziyaretçi kitapları arar, sepete ekler, üye olup sipariş verir
- Admin kitap ekler, stok ve sipariş durumlarını yönetir
- Her katman (veritabanı, API, arayüz) test edilir ve her push'ta CI'dan geçer

**Hedef dışı:** Gerçek ödeme, kargo entegrasyonu, e-posta bildirimleri. Bunlar projeyi büyütür ama öğrettiği şey azdır.

## Yapı

```
kitap-magazasi/
├── apps/
│   ├── api/        # Express 5 + TypeScript + PostgreSQL  (REST API)
│   └── web/        # Next.js + Tailwind                    (arayüz, Aşama 2)
├── docs/           # Bu doküman
├── docker-compose.yml
└── package.json    # npm workspaces: tek "npm install" ile hepsi
```

**Neden tek repo (monorepo)?** API ve arayüz birlikte değişir: yeni bir alan eklediğinde ikisini tek commit'te güncellersin, CI ikisini birlikte test eder. npm workspaces ek araç gerektirmeden bunu sağlar.

## Aşamalar

| Aşama | İçerik | Durum |
|---|---|---|
| 1 | Monorepo yapısı, üyelik/giriş (JWT), roller, siparişler, sayfalama | ✅ |
| 2 | Next.js arayüz: katalog, arama, sepet, giriş, siparişlerim, admin paneli | ⏳ |
| 3 | Canlı yayın: `kitap.uranusyazilim.com` (API + veritabanı + arayüz) | ⏳ |
| 4 | OpenAPI dokümantasyonu, uçtan uca testler (Playwright) | ⏳ |

## Veri Modeli

```
kullanicilar (id, ad, eposta UNIQUE, sifre_hash, rol, olusturulma)
kitaplar     (id, isim, yazar, fiyat, stok, olusturulma)
siparisler   (id, kullanici_id → kullanicilar, toplam, durum, olusturulma)
siparis_kalemleri (id, siparis_id → siparisler, kitap_id → kitaplar, adet, birim_fiyat)
```

- **`birim_fiyat` kalemde ayrıca saklanır.** Kitabın fiyatı yarın değişse bile geçmiş siparişin tutarı değişmemeli.
- **Para `NUMERIC(10,2)`.** `FLOAT` ondalıklarda yuvarlama hatası yapar (0.1 + 0.2 ≠ 0.3); para için asla kullanılmaz.
- **`rol` ve `durum` için `CHECK` kısıtı.** Geçersiz değer veritabanına hiç giremez; uygulama kodunda bir hata olsa bile.

## API Katmanları

```
istek → router (HTTP + Zod doğrulama) → repository (SQL) → PostgreSQL
                    ↓ hata
              hataYakalayici (tek yerden JSON hata yanıtı)
```

- **Router** sadece HTTP'yi bilir: parametreyi okur, doğrular, yanıt döner.
- **Repository** sadece veritabanını bilir. Router ona bir *arayüz* (interface) üzerinden ulaşır.
- **Neden arayüz?** Testlerde gerçek PostgreSQL yerine bellekte çalışan bir repository verilir (`tests/bellek/`). Testler milisaniyeler içinde, veritabanı kurmadan çalışır.

## Kimlik Doğrulama

- **Şifreler `scrypt` ile hash'lenir** (Node'un kendi `crypto` modülü, ek paket yok). Her şifreye rastgele bir *salt* eklenir; aynı şifreyi kullanan iki kullanıcının hash'i farklı olur. Karşılaştırma `timingSafeEqual` ile yapılır, böylece cevap süresinden bilgi sızmaz.
- **JWT** (`jose` kütüphanesi, HS256): giriş başarılıysa 7 gün geçerli bir token verilir. İstemci bunu `Authorization: Bearer <token>` başlığıyla gönderir.
- **Roller:** `musteri` (varsayılan) ve `admin`. Kayıt olan herkes müşteridir; admin yalnızca sunucuda komutla oluşturulur (`npm run admin -w apps/api`). Böylece kimse API üzerinden kendini admin yapamaz.
- **Hata mesajları kasıtlı olarak belirsiz:** "e-posta veya şifre hatalı". "Bu e-posta kayıtlı değil" demek, saldırgana hangi e-postaların kayıtlı olduğunu söyler.

## Sipariş Verme (en kritik akış)

Bir sipariş birden çok kitap içerir ve ya **tamamı** olur ya **hiçbiri**. Bu yüzden tek bir veritabanı **transaction**'ı içinde:

1. Siparişteki kitapların satırları `SELECT … FOR UPDATE` ile kilitlenir. Aynı anda gelen başka bir sipariş bu satırları bekler.
2. Her kitabın stoğu kontrol edilir; biri yetersizse `ROLLBACK` ve `409 Yetersiz stok`.
3. Stoklar düşülür, sipariş ve kalemleri yazılır, `COMMIT`.

Kilitler her zaman **kitap id sırasıyla** alınır. İki sipariş aynı kitapları farklı sırayla kilitlemeye çalışırsa birbirini sonsuza kadar bekleyebilir (*deadlock*); sabit sıra bunu önler.

**Fiyat istemciden alınmaz.** İstemci sadece `kitapId` ve `adet` gönderir, fiyat veritabanından okunur. Aksi halde biri tarayıcıda fiyatı 1 TL yapıp sipariş verebilirdi.

## Hata Yanıtları

Tüm hatalar aynı biçimde döner: `{ "hata": "…", "detaylar"?: […] }`

| Kod | Ne zaman |
|---|---|
| 400 | Doğrulama hatası (alan bazlı `detaylar` ile) |
| 401 | Token yok, geçersiz ya da süresi dolmuş |
| 403 | Giriş yapılmış ama yetki yok (müşteri admin işlemi deniyor) |
| 404 | Kayıt yok (veya başkasının siparişi; varlığını bile söylemeyiz) |
| 409 | Çakışma: e-posta kayıtlı, stok yetersiz |

## Kararlar ve Gerekçeleri

| Karar | Neden | Alternatif |
|---|---|---|
| Express 5 | Async hataları kendisi yakalar, en yaygın Node framework'ü | Fastify (daha hızlı, daha az yaygın) |
| Ham SQL (`pg`) | SQL'i öğrenmek için en iyisi; transaction ve kilit davranışı açıkça görünür | Prisma/Drizzle (daha az kod, daha az görünürlük) |
| Zod | Tek şemadan hem doğrulama hem TypeScript tipi | Joi, class-validator |
| `jose` | Standartlara uygun, bağımlılıksız, her ortamda çalışır | jsonwebtoken |
| Vitest + Supertest | Hızlı, TypeScript'i doğrudan çalıştırır | Jest |
