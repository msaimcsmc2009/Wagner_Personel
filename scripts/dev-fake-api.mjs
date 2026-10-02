/**
 * ⚠️⚠️ GEÇİCİ GELİŞTİRME ARAZI — SİLİNMELİ ⚠️⚠️
 *
 * Supabase bağlantısı kurulana kadar arayüzü gerçek veriyle GÖRMEK için
 * kullanılan sahte API sunucusu. Yalnızca bu geliştirme makinesinde çalışır,
 * veriler bellekte tutulur ve kalıcı HİÇBİR ŞEY yazmaz.
 *
 * NEDEN VAR: uygulama gerçek veri olmadan hiçbir ekranı göstermez —
 * dashboard "okunamadı" hatası verir, tablo hiç çizilmez. Bu araç, arayüzü
 * gerçek Supabase olmadan denemeye yarar.
 *
 * ⚠️ ASLA ÜRETİMDE KULLANILMAZ.
 *   - Veriler sahtedir; "120 kişi" gerçek bir veri DEĞİLDİR.
 *   - Kimlik doğrulama yoktur.
 *   - Sunucu kapanınca her şey silinir.
 *
 * ✅ Supabase `.env` değişkenleri girildiğinde bu dosya SİLİNMELİDİR.
 *    Yanlışlıkla gerçek backend yerine bu sunucu çalışırsa kullanıcı sahte
 *    sayıları gerçek sanar; bu, sessiz ve tehlikeli bir arıza biçimidir.
 *
 * Kullanım:
 *   1) Gerçek backend'i durdurun (3000 portu bırakın).
 *   2) `node scripts/dev-fake-api.mjs`
 *   3) Tarayıcıda http://localhost:5173 adresini açın.
 *   4) İşiniz bitince Ctrl+C ile durdurun ve `npm run dev` ile normal akışa dönün.
 *
 * Backend ile AYNİ sözleşmeyi konuşur: aynı rotalar, aynı gövde biçimi,
 * aynı hata kodları, aynı alan adları. Böylece arayüz gerçek backend'e
 * bağlandığında hiçbir değişiklik gerekmez.
 *
 * Bağımlılık YOKTUR — yalnızca Node'un yerleşik `node:http` modülü.
 */

import { createServer } from 'node:http';

/** Frontend Vite proxy'sinin varsayılan hedefi. */
const PORT = 3000;

/** Backend'in ürettiği hata gövdesiyle aynı biçim. */
const CATEGORIES = ['Üretim', 'Endirekt'];

/** En fazla kabul edilen değer — backend ile aynı sınır. */
const MAX_HEADCOUNT = 100_000;

/**
 * Örnek veri.
 *
 * Üretim 118 → 120 → 119, Endirekt 41 → 40 → 40 → 42 gibi kıvrımlı bir
 * seri kullanılır. Düz/artan bir seri, geçmiş ekranındaki fark göstergesinin
 * artış VE azalış yönlerini doğru çalıştığını göstermezdi.
 *
 * Tarihler `new Date()` ile hesaplanır, sabit yazılmaz: sabit bir 2026 tarihi
 * gerçekte olduğunda "geçen ay" gibi göreli dil yanlış okunur.
 */
const DAY = 24 * 60 * 60 * 1000;

/** `günÖnce kaç gün` → ISO tarih. */
function daysAgo(days, hours = 9) {
  const date = new Date(Date.now() - days * DAY);
  date.setHours(hours, 24, 0, 0);

  return date.toISOString();
}

let nextId = 1;

/** Bellekteki durum. Süreç kapanınca yok olur. */
const state = {
  /** `category → { headcount, updatedAt }`. */
  current: {
    Üretim: { headcount: 119, updatedAt: daysAgo(0) },
    Endirekt: { headcount: 42, updatedAt: daysAgo(0, 14) },
  },

  /**
   * Geçmiş, EN YENİDEN ESKİYE sıralı tutulur — backend'in
   * `recorded_at DESC` sırasıyla aynı. Arayüzdeki fark hesabı bu sıraya
   * dayanır; sıra ters çevrilirse oklar ters gösterir.
   *
   * İlk iki kayıt "başlangıç" kaydıdır; geri kalanlar gerçek değişiklikleri
   * temsil eder.
   */
  history: [
    { id: nextId++, category: 'Endirekt', headcount: 42, recordedAt: daysAgo(0, 14) },
    { id: nextId++, category: 'Üretim', headcount: 119, recordedAt: daysAgo(0) },
    { id: nextId++, category: 'Endirekt', headcount: 40, recordedAt: daysAgo(9) },
    { id: nextId++, category: 'Üretim', headcount: 120, recordedAt: daysAgo(16) },
    { id: nextId++, category: 'Endirekt', headcount: 41, recordedAt: daysAgo(24) },
    { id: nextId++, category: 'Üretim', headcount: 118, recordedAt: daysAgo(38) },
    { id: nextId++, category: 'Endirekt', headcount: 40, recordedAt: daysAgo(52) },
    { id: nextId++, category: 'Üretim', headcount: 115, recordedAt: daysAgo(70) },
    { id: nextId++, category: 'Üretim', headcount: 112, recordedAt: daysAgo(96) },
  ],
};

function total() {
  return CATEGORIES.reduce((sum, category) => sum + state.current[category].headcount, 0);
}

function sendJson(res, status, body) {
  const payload = JSON.stringify(body);

  res.writeHead(status, {
    'Content-Type': 'application/json; charset=utf-8',
    'Content-Length': Buffer.byteLength(payload),
  });
  res.end(payload);
}

/** Backend'in `errorHandler` ile ürettiği biçim. `message` Türkçedir. */
function sendError(res, status, code, message) {
  sendJson(res, status, { error: { code, message } });
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    let size = 0;

    req.on('data', (chunk) => {
      size += chunk.length;

      // Sınırsız gövde kabul edilmez; bu bir geliştirme aracı olsa da
      // istemci beklenmedik büyük bir gövde gönderirse takılmasın.
      if (size > 100_000) {
        reject(new Error('too_large'));
        req.destroy();

        return;
      }

      chunks.push(chunk);
    });
    req.on('end', () => resolve(Buffer.concat(chunks).toString('utf8')));
    req.on('error', reject);
  });
}

const server = createServer(async (req, res) => {
  const url = new URL(req.url ?? '/', `http://${req.headers.host ?? 'localhost'}`);
  const path = url.pathname.replace(/\/+$/, '') || '/';
  const method = req.method ?? 'GET';

  console.log(`  ${method} ${url.pathname}${url.search}`);

  // --- GET /api/health -----------------------------------------------------
  if (method === 'GET' && path === '/api/health') {
    sendJson(res, 200, { status: 'ok', supabaseConfigured: false, note: 'SAHTE VERİ SUNUCUSU' });

    return;
  }

  // --- GET /api/staff-counts ----------------------------------------------
  if (method === 'GET' && path === '/api/staff-counts') {
    sendJson(res, 200, {
      categories: CATEGORIES.map((category) => ({
        category,
        headcount: state.current[category].headcount,
        updatedAt: state.current[category].updatedAt,
      })),
      total: total(),
    });

    return;
  }

  // --- GET /api/staff-counts/history --------------------------------------
  if (method === 'GET' && path === '/api/staff-counts/history') {
    const categoryFilter = url.searchParams.get('category');
    const limitRaw = url.searchParams.get('limit');

    if (categoryFilter !== null && !CATEGORIES.includes(categoryFilter)) {
      sendError(res, 422, 'UNKNOWN_CATEGORY', 'Kategori "Üretim" veya "Endirekt" olmalıdır.');

      return;
    }

    let limit = 10;

    if (limitRaw !== null) {
      const parsed = Number(limitRaw);

      if (!Number.isInteger(parsed) || parsed < 1) {
        sendError(res, 422, 'INVALID_LIMIT', 'Kayıt sayısı 1 veya daha büyük bir tam sayı olmalıdır.');

        return;
      }

      limit = Math.min(parsed, 100);
    }

    const filtered = categoryFilter === null
      ? state.history
      : state.history.filter((entry) => entry.category === categoryFilter);

    sendJson(res, 200, { data: filtered.slice(0, limit) });

    return;
  }

  // --- PATCH /api/staff-counts -------------------------------------------
  if (method === 'PATCH' && path === '/api/staff-counts') {
    let body;

    try {
      body = JSON.parse(await readBody(req));
    } catch {
      sendError(res, 400, 'INVALID_BODY', 'İstek gövdesi okunamadı. Geçerli bir JSON nesnesi gönderin.');

      return;
    }

    if (body === null || typeof body !== 'object' || Array.isArray(body)) {
      sendError(res, 400, 'INVALID_BODY', 'İstek gövdesi bir JSON nesnesi olmalıdır.');

      return;
    }

    if (body.category === undefined || body.category === null || body.category === '') {
      sendError(res, 422, 'MISSING_CATEGORY', 'Lütfen bir grup seçin.');

      return;
    }

    if (!CATEGORIES.includes(body.category)) {
      sendError(
        res,
        422,
        'UNKNOWN_CATEGORY',
        `"${body.category}" geçerli bir grup değil. "Üretim" veya "Endirekt" seçin.`,
      );

      return;
    }

    if (body.headcount === undefined || body.headcount === null || body.headcount === '') {
      sendError(res, 422, 'MISSING_HEADCOUNT', 'Personel sayısını girin.');

      return;
    }

    if (typeof body.headcount !== 'number' || !Number.isFinite(body.headcount)) {
      sendError(res, 422, 'INVALID_HEADCOUNT', 'Personel sayısı bir tam sayı olmalıdır.');

      return;
    }

    if (!Number.isInteger(body.headcount)) {
      sendError(res, 422, 'INVALID_HEADCOUNT', 'Personel sayısı ondalıklı olamaz.');

      return;
    }

    if (body.headcount < 0) {
      sendError(res, 422, 'NEGATIVE_HEADCOUNT', 'Personel sayısı negatif olamaz.');

      return;
    }

    if (body.headcount > MAX_HEADCOUNT) {
      sendError(
        res,
        422,
        'HEADCOUNT_TOO_LARGE',
        `Personel sayısı ${MAX_HEADCOUNT.toLocaleString('tr-TR')} değerini aşamaz.`,
      );

      return;
    }

    const now = new Date().toISOString();

    state.current[body.category] = { headcount: body.headcount, updatedAt: now };
    state.history.unshift({
      id: nextId++,
      category: body.category,
      headcount: body.headcount,
      recordedAt: now,
    });

    sendJson(res, 200, {
      category: body.category,
      headcount: body.headcount,
      updatedAt: now,
      total: total(),
    });

    return;
  }

  sendError(res, 404, 'NOT_FOUND', 'Böyle bir uç nokta yok.');
});

server.listen(PORT, () => {
  console.log('');
  console.log('  ╔══════════════════════════════════════════════════════════════╗');
  console.log('  ║  SAHTE VERİ SUNUCUSU — GEÇİCİ, SİLİNMELİ                  ║');
  console.log('  ╠══════════════════════════════════════════════════════════════╣');
  console.log(`  ║  http://localhost:${PORT}/api/staff-counts`.padEnd(64) + '║');
  console.log(`  ║  http://localhost:${PORT}/api/staff-counts/history`.padEnd(64) + '║');
  console.log('  ║                                                              ║');
  console.log('  ║  Veriler SAHTEDİR ve bellekte tutulur. Durdurulunca kaybolur. ║');
  console.log('  ║  Supabase bağlanınca bu dosyayı SİLİN.                       ║');
  console.log('  ╚══════════════════════════════════════════════════════════════╝');
  console.log('');
});
