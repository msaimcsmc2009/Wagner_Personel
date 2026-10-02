# Wagner Kablo Personel Sistemi

Merkezi personel yönetimi için web tabanlı sistem. Kapsamı bilinçli olarak
daraltılmıştır: **tek tek personel kaydı tutulmaz.** Uygulamada yalnızca
"Üretim" ve "Endirekt" için toplam personel **sayısı** saklanır, bu sayıların
değişiklik geçmişi tutulur ve sayıları güncelleme yetkisi yöneticilerdedir.

## Teknolojiler

| Katman | Teknoloji |
| --- | --- |
| Frontend | React 19 · TypeScript 5.9 · Vite 8 · Tailwind CSS 4 |
| Backend | Node.js 20+ · TypeScript 5.9 · Express 5 |
| Veritabanı | Supabase · PostgreSQL (şema migration dosyalarıyla verilir) |
| Kimlik | Supabase Auth (parola) + `profiles` tablosunda rol |
| Paket yönetimi | npm workspaces |

## Gereksinimler

- Node.js **20.19+** (geliştirme ortamında 24.21 ile doğrulandı)
- npm **10+**

## Kurulum

```bash
npm install
```

Ortam değişkenlerini hazırlayın:

```bash
cp backend/.env.example  backend/.env
cp frontend/.env.example frontend/.env
```

`.env` dosyaları `.gitignore` ile ignore edilir; yalnızca `.env.example`
versiyonlanır. Gerçek anahtar veya parola **asla** kaynak koda yazılmaz.

Supabase değişkenleri (URL, anon key, service role key) Supabase proje
ayarlarından alınır. Boş bırakılırsa backend yine çalışır ve
`/api/health` `"database": "not_configured"` döner; ancak giriş ve sayı
ekranları çalışmaz.

## Veritabanı kurulumu

Migration dosyaları `backend/migrations/` altında, sıra numarasına göre
uygulanır. Bu projede migration çalıştıran bir komut yoktur: dosyalar
**Supabase → SQL Editor**'de açılıp çalıştırılır.

| Dosya | Ne yapar |
| --- | --- |
| `0001_staff_counts.sql` | `staff_counts`, `staff_count_history`, tetikleyiciler, RLS açılışı, başlangıç değerleri |
| `0002_profiles.sql` | `profiles` tablosu ve RLS politikaları |
| `0003_history_fk_and_rls.sql` | `recorded_by` + FK, tablo RLS politikaları |
| `0004_staff_counts_seed.sql` | Başlangıç sayıları |
| `0005_roles_grants_and_write.sql` | Tablo izinleri, `handle_new_user` trigger'ı, `record_staff_count` yazma fonksiyonu |

**Sıra önemlidir.** `0005` olmadan uygulama iki yerde kırılır:

- Rol okunamaz (`profiles` üzerinde GRANT yoktur) → yönetici özellikleri
  çalışmaz, admin'e özel ekranlar açılmaz.
- Sayı kaydı yapılamaz (`record_staff_count` fonksiyonu yoktur).

Migration'lar tekrar çalıştırılabilir (idempotent). Uygulama sonunda
PostgREST şema önbelleği `NOTIFY pgrst, 'reload schema'` ile yenilenir.

### İlk yöneticiyi atama

`profiles` satırları artık `handle_new_user` trigger'ı ile **yeni** kullanıcılar
için otomatik açılır ve `role='user'` olur. İlk yönetici elle atanır.
Supabase Auth'ta kullanıcıyı oluşturduktan sonra SQL Editor'da:

```sql
insert into profiles (id, full_name, role)
select u.id,
       coalesce(u.raw_user_meta_data ->> 'full_name',
                split_part(u.email, '@', 1),
                'Kullanıcı'),
       'admin'
from auth.users u
where u.email = 'yonetici@firma.com'
on conflict (id) do update set role = 'admin', updated_at = now();
```

Bu sorgu `0005` uygulanmadan çalışmaz: tablo izinleri düzeltilmeden
`service_role` `profiles` tablosunu göremez.

## Çalıştırma

```bash
npm run dev
```

Bu komut iki uygulamayı aynı anda başlatır:

| Uygulama | Adres |
| --- | --- |
| Frontend (Vite) | http://localhost:5173 |
| Backend (Express) | http://localhost:3000 |
| Sağlık kontrolü | http://localhost:3000/api/health |

Tek tek çalıştırmak için:

```bash
npm run dev:backend
npm run dev:frontend
```

## Komutlar

| Komut | Açıklama |
| --- | --- |
| `npm run dev` | Frontend + backend birlikte (concurrently) |
| `npm run dev:backend` | Yalnızca backend, `tsx watch` ile |
| `npm run dev:frontend` | Yalnızca frontend, Vite dev server |
| `npm run typecheck` | Her iki uygulamada TypeScript denetimi |
| `npm run build` | Önce tip denetimi, sonra iki uygulamanın build'i |
| `npm run start:backend` | Derlenmiş backend'i çalıştırır (`dist/`) |
| `npm run preview:frontend` | Derlenmiş frontend'i önizler |
| `npm run clean` | `dist/` klasörlerini temizler |
| `npm run backend:status` | Arka plandaki backend sürecinin durumu (Windows) |
| `npm run backend:start` / `:stop` / `:restart` | Backend sürecini yönetir |
| `npm run backend:clean-orphans` | Portu tutan öksüz backend süreçlerini kapatır |
| `npm run backend:selftest` | Sağlık ucunu yoklayan hızlı kendi kendine test |

## API

Tüm uçlar `Authorization: Bearer <access_token>` ister.

| Uç | Yetki | Açıklama |
| --- | --- | --- |
| `GET /api/health` | — | Servis ve veritabanı durumu |
| `GET /api/auth/me` | Giriş | Oturum açan kullanıcının profili ve rolü |
| `GET /api/staff-counts` | Giriş | Güncel sayılar (Üretim / Endirekt) ve toplam |
| `GET /api/staff-counts/history` | Giriş | Değişiklik geçmişi |
| `PATCH /api/staff-counts` | **Yönetici** | Bir kategorinin sayısını günceller, geçmişe kayıt ekler |

**Rol tek kaynaktan gelir.** Frontend rolü backend'den (`/api/auth/me`) alır;
tarayıcı veritabanına hiçbir tabloya doğrudan bağlanmaz. `supabase-js`
yalnızca kimlik doğrulama (giriş, oturum, token) için kullanılır.

## Proje yapısı

```
.
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── auth/       ProtectedRoute.tsx
│   │   │   ├── icons/      UiIcons.tsx
│   │   │   ├── layout/     Sidebar, Topbar, PageHeader
│   │   │   └── ui/         Button, Card, Field, Alert, Badge, EmptyState,
│   │   │                   Skeleton, Pagination, Overlay, Dropdown, …
│   │   ├── config/         navigation.tsx  ← menü + breadcrumb + yetki bayrakları
│   │   ├── contexts/       AuthContext.tsx  ← oturum ve rol
│   │   ├── layouts/        AppLayout.tsx
│   │   ├── lib/            apiClient yardımcıları: format, cn, user
│   │   ├── pages/          Dashboard, PersonelSayıları, EskiKayıtlar,
│   │   │                   Giriş, SistemDurumu
│   │   ├── services/       apiClient, authService, healthService, staffCountService
│   │   ├── styles/         index.css   ← tasarım sistemi token'ları
│   │   ├── types/          auth.ts, health.ts, staffCount.ts
│   │   ├── App.tsx
│   │   └── main.tsx
│   └── vite.config.ts
│
├── backend/
│   ├── migrations/         0001…0005 SQL dosyaları (yukarıya bakın)
│   └── src/
│       ├── config/         env.ts, logger.ts, supabase.ts
│       ├── controllers/    health, auth, staffCount
│       ├── middleware/     auth.middleware.ts, errorHandler.ts, requestLogger.ts
│       ├── repositories/   profile.repository.ts, staffCount.repository.ts
│       ├── routes/         index.ts, health, auth, staffCount
│       ├── services/       health, auth, staffCount
│       ├── types/          auth.ts, health.ts, staffCount.ts
│       ├── utils/          AppError.ts
│       ├── app.ts
│       └── index.ts
│
├── scripts/                backend-lifecycle.ps1, dev-fake-api.mjs, verify-ui.mjs
├── .opencode/skills/       UI/UX tasarım sistemi dokümantasyonu
└── AGENTS.md               Proje çalışma kuralları
```

## Mimari kararlar

**Katman ayrımı.** Frontend ve backend iki ayrı npm workspace'idir ve
birbirinden bağımsız derlenir. Route → controller → service → repository →
Supabase sırası korunur; controller doğrudan veri tabanına dokunmaz.

**Tek yazma yolu.** Sayı güncellemesi `record_staff_count` RPC'siyle tek
transaction'da yapılır: güncel değer ve geçmiş kaydı birlikte yazılır, ikisi
ayrılamaz. Yetki, backend'de `requireAdmin` ile ve veritabanında `p_actor`
üzerinden iki kez denetlenir.

**İzinler migration'da açıkça verilir.** Supabase `ALTER DEFAULT PRIVILEGES`
ayarları projeye göre değişebildiği için `0005` GRANT'ları kendisi yazar.
`anon` rolüne hiçbir tablo için izin verilmez.

**Ortam değişkenleri.** Backend `.env` dosyasını Node'un yerleşik
`process.loadEnvFile()` ile okur (harici paket yok). Eksik zorunlu
değişkenler tek seferde listelenir ve uygulama başlamayı reddeder. Üretimde
değişkenler platform tarafından gerçek ortam olarak verilir.

**Güvenlik.** Supabase `service_role` anahtarı yalnızca backend'de
bulunur ve frontend'e asla verilmez. Frontend'e sızan tek değişken
namespace'i `VITE_` önekidir; gizli anahtarlar burada tanımlanmaz. Public
signup kapalıdır; kullanıcılar Supabase Auth üzerinden yönetici tarafından
oluşturulur.

**Arayüz.** Tasarım değerleri tek kaynaktan (`frontend/src/styles/index.css`
içindeki Tailwind `@theme` bloğu) gelir. Değerler `.opencode/skills/ui-ux-pro`
dokümantasyonuyla doğrulanmıştır: marka laciverti `#092C74`, Roboto tipografi,
WCAG AA kontrast oranları, 48px tablo satırı, 6px kontrol yarıçapı.

**Hareket tek yerden.** Süreler (`--wk-duration-fast/base/slow`) ve eğri
(`--ease-wk`) `index.css` içinde tanımlıdır; bileşenler keyfi süre yazmaz.
Dört giriş hareketi vardır ve hepsi `transform` + `opacity` üzerinden çalışır:
sayfa girişi (`animate-rise-in`), tablo satırı (`animate-row-in`), açılır
menü (`animate-menu-in`) ve grafik çubukları (`animate-grow-up`). Satır
gecikmeleri `Math.min` ile tavanlanır, böylece uzun listelerde toplam bekleme
sabit kalır. Tüm animasyonlar `both` dolguludur ve taban katmandaki
`prefers-reduced-motion` kuralı hem süreleri hem gecikmeleri sıfırlar —
içerik azaltılmış hareket modunda da görünür kalır.

**Kullanılmayan yüzeyler kaldırılmıştır.** `/ayarlar` rotası, menü girdisi,
`SİSTEM` bölümü ve `SettingsPage` birlikte silindi: ekran bir boş durum
stub'ıydı. `ProfilePage` ve `UserManagementPage` hiçbir route'a bağlı
olmadığı için silindi. Backend'de bu ekranlara karşılık gelen uc, tablo veya
migration **yoktur**; temizlik yalnız frontend'de yapılmıştır. Üst çubuktaki
kullanıcı menüsü artık yalnız kimlik bilgisini (ad + rol) ve `Çıkış Yap`
eylemini taşır; `AuthContext` ve `signOut` değiştirilmemiştir.

## Bu aşamada neler YAPILMADI

Personel CRUD, günlük çalışan takibi, giriş/çıkış kayıtları, izin yönetimi,
eğitim kayıtları, raporlar ve sistem ayarlarının gerçek uygulaması bilinçli
olarak kapsam dışı bırakıldı. Uygulamada **yalnızca** toplam sayı, bu
sayıların geçmişi ve bunları güncelleme yetkisi vardır.
