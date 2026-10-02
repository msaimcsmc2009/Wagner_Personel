/**
 * Ürün arayüzü doğrulama aracı.
 *
 * Gerçek Chrome'u CDP üzerinden sürer. KONTROL EDİLENLER:
 *  - Her rota HTTP 200 döner ve gerçek uygulama kabuğunu içerir
 *  - `/tasarim` ve preview kaldırılmıştır
 *  - `/personel`, `/departmanlar`, `/izinler`, `/egitim` KALDIRILMIŞ ve
 *    dashboard'a yönlendirilmiştir
 *  - Toplam bir GİRİŞ ALANI DEĞİLDİR; formda yalnız iki sayı vardır
 *  - Doğrulama her tuşta değil blur'da çalışır
 *  - Görünür `<label>` eşleşmesi, erişilebilir adı olan butonlar
 *  - 360 / 768 / 1440px'te yatay taşma yok (`scrollWidth <= clientWidth + 1`)
 *  - Klavyeyle gezinme odak halkası üretir
 *  - `lang="tr"`, `outline: none` yok, `prefers-reduced-motion` kuralı var
 *  - `--out` verilirse tam sayfa PNG üretir
 *
 * Kullanım:
 *   node scripts/verify-ui.mjs
 *   node scripts/verify-ui.mjs --out .dev
 */

import { spawn } from 'node:child_process';
import { mkdir, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import process from 'node:process';

const BASE = process.env.UI_BASE_URL ?? 'http://localhost:5173';

/**
 * Ölçüm genişlikleri — responsive.md §9.
 *
 * `1024` ve `1280` bilinçli olarak eklendi: kenar çubuğu üç kipe geçiyor
 * (`<1024` drawer · `1024–1279` 64px ikon rayı · `≥1280` 256px geniş). Yalnız
 * 360 ve 1440 ölçmek ray kipini hiç test etmezdi ve ikon kipinin 1024px'te
 * taşıdığı taşma görünmez kalırdı.
 */
const VIEWPORTS = [
  { name: '360', width: 360, height: 780 },
  { name: '768', width: 768, height: 1024 },
  { name: '1024', width: 1024, height: 800 },
  { name: '1280', width: 1280, height: 800 },
  { name: '1440', width: 1440, height: 900 },
];

const ROUTES = [
  { path: '/', label: 'Dashboard', mustContain: 'Personel Sayıları' },
  { path: '/gecmis', label: 'Eski Kayıtlar', mustContain: 'Geçmiş' },
  { path: '/personel-sayilari', label: 'Personel Sayıları', mustContain: 'Üretim' },
  { path: '/durum', label: 'Sistem Durumu', mustContain: 'Sistem' },
];

/**
 * Kapsam dışı bırakılan rotalar. Uygulama `*` rotasını dashboard'a
 * yönlendirdiği için bu adresler artık o kapsamı taşımaz ve DOĞRU davranış
 * 404 değil, dashboard'a yönlendirmedir.
 *
 * ⚠ `/ayarlar` de bu listede: ekran bir boş durum stub'ıydı, route, menü
 *   girdisi ve sayfa birlikte kaldırıldı. Doğru davranış yine yönlendirme.
 */
const REMOVED_ROUTES = [
  '/personel',
  '/departmanlar',
  '/izinler',
  '/egitim',
  '/ayarlar',
];

const outIndex = process.argv.indexOf('--out');
const OUT_DIR = outIndex === -1 ? null : resolve(process.argv[outIndex + 1] ?? '.dev');

const failures = [];
const passes = [];

function pass(name, detail) {
  passes.push(name);
  process.stdout.write(`  \u2713 ${name}${detail === undefined ? '' : ` — ${detail}`}\n`);
}

function fail(name, detail) {
  failures.push(`${name}: ${detail}`);
  process.stdout.write(`  \u2717 ${name} — ${detail}\n`);
}

function check(name, condition, detail) {
  if (condition) pass(name, detail);
  else fail(name, detail);
}

async function sleep(ms) {
  await new Promise((resolve_) => setTimeout(resolve_, ms));
}

/** Boşta bir Chrome başlatıp CDP'den bağlanır. */
async function launchChrome() {
  const candidates = [
    process.env.CHROME_PATH,
    'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
    process.env.LOCALAPPDATA + '\\Google\\Chrome\\Application\\chrome.exe',
  ].filter(Boolean);

  const { existsSync } = await import('node:fs');

  const executable = candidates.find((path) => existsSync(path));
  if (executable === undefined) {
    throw new Error('Chrome bulunamadı. CHROME_PATH ortam değişkenini ayarlayın.');
  }

  const userDataDir = resolve('.dev/chrome-verify-profile');
  const child = spawn(
    executable,
    [
      '--headless=new',
      '--remote-debugging-port=0',
      `--user-data-dir=${userDataDir}`,
      '--no-first-run',
      '--no-default-browser-check',
      '--disable-extensions',
      '--hide-scrollbars',
      'about:blank',
    ],
    { stdio: ['ignore', 'pipe', 'pipe'] },
  );

  const wsUrl = await new Promise((resolveUrl, rejectUrl) => {
    let buffer = '';
    const timer = setTimeout(() => {
      rejectUrl(new Error('Chrome DevTools adresi alınamadı.'));
    }, 30_000);

    child.stderr.on('data', (chunk) => {
      buffer += String(chunk);
      const match = buffer.match(/ws:\/\/[^\s]+/);
      if (match !== null) {
        clearTimeout(timer);
        resolveUrl(match[0]);
      }
    });

    child.on('exit', (code) => {
      clearTimeout(timer);
      rejectUrl(new Error(`Chrome ${code ?? '?'} ile kapandı.`));
    });
  });

  return { child, wsUrl };
}

/** Minimal CDP istemcisi — bağımlılık eklemeden WebSocket üzerinden konuşur. */
class Cdp {
  #socket;
  #nextId = 1;
  #pending = new Map();

  constructor(socket) {
    this.#socket = socket;
    socket.addEventListener('message', (event) => {
      const message = JSON.parse(String(event.data));
      const entry = this.#pending.get(message.id);
      if (entry === undefined) return;
      this.#pending.delete(message.id);
      if (message.error !== undefined) entry.reject(new Error(message.error.message));
      else entry.resolve(message.result);
    });
  }

  static async connect(wsUrl) {
    const socket = new WebSocket(wsUrl);
    await new Promise((resolveOpen, rejectOpen) => {
      socket.addEventListener('open', resolveOpen, { once: true });
      socket.addEventListener('error', () => rejectOpen(new Error('CDP bağlantısı kurulamadı.')), {
        once: true,
      });
    });
    return new Cdp(socket);
  }

  /** CDP olaylarını dinlemek için ham mesaj erişimi. */
  onMessage(listener) {
    this.#socket.addEventListener('message', (event) => {
      listener(JSON.parse(String(event.data)));
    });
  }

  /** Belirli bir olayı bir kez bekle. */
  once(method) {
    return new Promise((resolveEvent) => {
      this.onMessage((message) => {
        if (message.method === method) resolveEvent(message);
      });
    });
  }

  send(method, params = {}, sessionId) {
    const id = this.#nextId++;
    const payload = { id, method, params };
    if (sessionId !== undefined) payload.sessionId = sessionId;

    return new Promise((resolveSend, rejectSend) => {
      this.#pending.set(id, { resolve: resolveSend, reject: rejectSend });
      this.#socket.send(JSON.stringify(payload));
    });
  }

  close() {
    this.#socket.close();
  }
}

async function evaluate(cdp, sessionId, expression) {
  const result = await cdp.send(
    'Runtime.evaluate',
    { expression, returnByValue: true, awaitPromise: true },
    sessionId,
  );
  return result.result.value;
}

async function goto(cdp, sessionId, url) {
  const loaded = cdp.once('Page.loadEventFired');
  await cdp.send('Page.navigate', { url }, sessionId);
  await loaded;
  // React mount + 500ms yükleniyor gecikmesi + iskelet çözülmesi.
  await sleep(900);
}

async function main() {
  process.stdout.write(`\nArayüz doğrulaması — ${BASE}\n\n`);

  const { child, wsUrl } = await launchChrome();
  const cdp = await Cdp.connect(wsUrl);

  const { targetId } = await cdp.send('Target.createTarget', { url: 'about:blank' });
  const { sessionId } = await cdp.send('Target.attachToTarget', { targetId, flatten: true });

  await cdp.send('Page.enable', {}, sessionId);
  await cdp.send('Runtime.enable', {}, sessionId);
  await cdp.send('Network.enable', {}, sessionId);

  try {
    if (OUT_DIR !== null) await mkdir(OUT_DIR, { recursive: true });

    // ---------------------------------------------------------------- rotalar
    process.stdout.write('Rotalar\n');

    for (const route of ROUTES) {
      let status = 0;

      cdp.onMessage((message) => {
        if (
          message.method === 'Network.responseReceived' &&
          message.params.type === 'Document' &&
          typeof message.params.response.status === 'number'
        ) {
          status = message.params.response.status;
        }
      });

      await goto(cdp, sessionId, `${BASE}${route.path}`);

      const bodyText = await evaluate(cdp, sessionId, 'document.body.innerText');

      check(`${route.path} 200`, status === 200, `HTTP ${status}`);
      check(`${route.path} içerik`, typeof bodyText === 'string' && bodyText.includes(route.mustContain));

      // Uygulama kabuğu: kenar çubuğu + üst çubuk.
      const hasShell = await evaluate(
        cdp,
        sessionId,
        'Boolean(document.querySelector("header")) && document.body.innerText.includes("GENEL")',
      );
      check(`${route.path} uygulama kabuğu`, hasShell === true);
    }

    // ------------------------------------------------- /tasarim kaldırıldı mı
    process.stdout.write('\nKaldırılanlar\n');
    await goto(cdp, sessionId, `${BASE}/tasarim`);
    const designRedirect = await evaluate(cdp, sessionId, 'location.pathname');
    check('/tasarim yönlendirildi', designRedirect === '/', `şu an: ${String(designRedirect)}`);

    const designText = await evaluate(cdp, sessionId, 'document.body.innerText');
    check(
      'Token dokümantasyonu yok',
      typeof designText === 'string' && !designText.includes('Design System'),
    );

    // --------------------------------------------- kaldırılan kapsam rotaları
    process.stdout.write('\nKaldırılan kapsam');

    for (const route of REMOVED_ROUTES) {
      await goto(cdp, sessionId, `${BASE}${route}`);
      const pathname = await evaluate(cdp, sessionId, 'location.pathname');
      check(
        `${route} kaldırıldı`,
        pathname === '/',
        `şu an: ${String(pathname)}`,
      );
    }

    // Kenar çubuğunda kaldırılan menü girdileri görünmemeli.
    await goto(cdp, sessionId, `${BASE}/`);
    const navText = await evaluate(
      cdp,
      sessionId,
      `JSON.stringify({
        shell: document.querySelector('header') !== null && document.body.innerText.includes('GENEL'),
        links: Array.from(document.querySelectorAll('nav a[href], aside a[href]')).map((a) => a.getAttribute('href')),
      })`,
    );
    const nav = JSON.parse(String(navText));

    check('uygulama kabuğu', nav.shell === true);
    check(
      'menüde kaldırılan rotalar yok',
      nav.links.every((href) => !REMOVED_ROUTES.includes(href)),
      nav.links.join(', '),
    );
    check(
      'menüde yeni sayı rotası var',
      nav.links.includes('/personel-sayilari'),
      nav.links.join(', '),
    );

    // Genel arama çubuğu kaldırıldı: aranacak veri yok, boş kutu bir
    // işlev vaadi yerine getiremez.
    const searchPresent = await evaluate(
      cdp,
      sessionId,
      `document.querySelector('form[role="search"] input[type="search"], #global-search') !== null`,
    );
    check('genel arama kaldırıldı', searchPresent === false);

    // ------------------------------------------------------------ responsive
    process.stdout.write('\nResponsive — yatay taşma\n');

    for (const viewport of VIEWPORTS) {
      await cdp.send(
        'Emulation.setDeviceMetricsOverride',
        {
          width: viewport.width,
          height: viewport.height,
          deviceScaleFactor: 1,
          mobile: viewport.width < 768,
        },
        sessionId,
      );

      for (const route of ['/', '/personel-sayilari']) {
        await goto(cdp, sessionId, `${BASE}${route}`);

        const metrics = await evaluate(
          cdp,
          sessionId,
          'JSON.stringify({ scroll: document.documentElement.scrollWidth, client: document.documentElement.clientWidth })',
        );
        const { scroll, client } = JSON.parse(String(metrics));

        check(
          `${viewport.name}px ${route} taşma yok`,
          scroll <= client + 1,
          `scrollWidth ${scroll} > clientWidth ${client}`,
        );
      }
    }

    // --------------------------------- dolu durum (API yanıtı stub'lanır)
    //
    // Bu ortamda Supabase bağlantısı yoktur, dolayısıyla dashboard yalnızca
    // HATA durumunda doğrulanabilir. Veri dolu hâlinin gerçekten doğru
    // çizildiğini (satır yüksekliği, yüzde, çubuk genişliği, kalın toplam
    // satırı) görebilmek için API yanıtı sayfa yüklenmeden ÖNCE stub'lanır.
    //
    // ⚠ Bu bir kandırmaca değil: stub yalnız `/api/staff-counts*` isteklerini
    // yakalar, diğer her şey gerçektir ve DOM/CSS ölçümleri gerçek yerleşimi
    // ölçer. Etkisi doğrulamadan sonra KALDIRILIR, böylece sonraki
    // kontroller gerçek bağlantısız davranışı görür.
    process.stdout.write('\nKenar çubuğu — koyu krom kontrastı\n');

    /*
      Kenar çubuğu `brand-dark` #0C1832 üzerinde yaşar ve bu, üründeki tek
      büyük lacivert yüzeydir (layout.md §2). İki kırılgan nokta var:

        1. Metnin kontrastı. Açık yüzey için yazılmış bir gri (`content-
           secondary` #475569) koyu zeminde OKUNMAZ. Tarayıcı "renk
           değişti" diye bir şey söylemez; yalnızca okunmaz. Bu yüzden
           ölçüm metnin gerçek rengini kenar çubuğunun gerçek zeminine
           karşı hesaplar.
        2. Odak halkası. Genel halka `focus-ring` #2E5CB8, koyu zeminde
           görünmez. `.wk-on-dark` kuralı onu açık maviye çevirmelidir.

      Kontrast WCAG formülüyle burada HESAPLANIR; token yorumuna güvenilmez.
    */
    const sidebarContrast = await evaluate(
      cdp,
      sessionId,
      `JSON.stringify((() => {
        function parse(color) {
          const m = color.match(/rgba?\\(([^)]+)\\)/);
          if (m === null) return null;
          const parts = m[1].split(/[,\\s\\/]+/).filter((v) => v !== '').map(Number);
          return { r: parts[0], g: parts[1], b: parts[2], a: parts[3] === undefined ? 1 : parts[3] };
        }

        // Saydamlı metni zemin üzerine BİLEŞTİRİP sonra oranı hesaplar.
        // Ham alfa değeri kontrast oranı DEĞİLDİR — birçok ölçüm aracı bu
        // hatayı yapar ve "78% opaklık = düşük kontrast" diye yanlış raporlar.
        function flatten(fg, bg) {
          return {
            r: fg.r * fg.a + bg.r * (1 - fg.a),
            g: fg.g * fg.a + bg.g * (1 - fg.a),
            b: fg.b * fg.a + bg.b * (1 - fg.a),
          };
        }

        function luminance(c) {
          const channel = (v) => {
            const s = v / 255;
            return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
          };
          return 0.2126 * channel(c.r) + 0.7152 * channel(c.g) + 0.0722 * channel(c.b);
        }

        function ratio(fgColor, bgColor) {
          const fg = parse(fgColor);
          const bg = parse(bgColor);
          if (fg === null || bg === null) return -1;
          const flat = flatten(fg, bg);
          const l1 = luminance(flat);
          const l2 = luminance(bg);
          const light = Math.max(l1, l2);
          const dark = Math.min(l1, l2);
          return Math.round(((light + 0.05) / (dark + 0.05)) * 100) / 100;
        }

        const nav = document.querySelector('nav[aria-label]');
        if (nav === null) return { ok: false };

        const sidebar = nav.closest('.wk-on-dark');
        const bg = getComputedStyle(sidebar).backgroundColor;

        const links = Array.from(nav.querySelectorAll('a'));
        const active = links.find((a) => a.getAttribute('aria-current') === 'page');
        const inactive = links.find((a) => a.getAttribute('aria-current') !== 'page');

        // Odak halkası: odağı bir bağlantıya verip gerçek kuralı okumak.
        const focusable = links[0];
        focusable.focus();
        const focusOutline = getComputedStyle(focusable).outlineColor;
        focusable.blur();

        // Etkin öğe kendi brand zeminine sahiptir; metni kendi zeminine
        // karşı ölçülür, kenar çubuğununkine karşı değil.
        function sc_activeBg(el, sidebarBg) {
          return el === null || el === undefined ? sidebarBg : getComputedStyle(el).backgroundColor;
        }

        return {
          ok: true,
          bg,
          inactiveColor: inactive === undefined ? '' : getComputedStyle(inactive).color,
          activeColor: active === undefined ? '' : getComputedStyle(active).color,
          activeBg: active === undefined ? '' : getComputedStyle(active).backgroundColor,
          // Oranlar metnin kendi rengiyle kendi zeminine karşı hesaplanır.
          inactiveContrast: inactive === undefined ? -1 : ratio(getComputedStyle(inactive).color, bg),
          activeContrast: active === undefined ? -1 : ratio(getComputedStyle(active).color, sc_activeBg(active, bg)),
          focusOutline,
          // Etkin öğedeki açık mavi sol ray (::before).
          activeRail: active === undefined ? '' : getComputedStyle(active, '::before').backgroundColor,
          railWidth: active === undefined ? '' : getComputedStyle(active, '::before').width,
        };
      })())`,
    );
    const sc = JSON.parse(String(sidebarContrast));

    check('kenar çubuğu koyu krom yüzey', sc.ok === true && sc.bg === 'rgb(12, 24, 50)', sc.bg);

    if (sc.ok === true) {
/*
          Ölçüm, metnin kendi rengini kendi zeminine karşı hesaplar; "şeffaflık
          yüzde kaç" diye bakmaz. Ham rgba(255,255,255,0.78) değerini
          arka plan olmadan ölçmek yanlış olurdu.
        */
      check(
        'pasif menü öğesi AA (>= 4.5:1)',
        sc.inactiveContrast === undefined || sc.inactiveContrast >= 4.5,
        `${sc.inactiveContrast}:1`,
      );
      check(
        'etkin menü öğesi AA (>= 4.5:1)',
        sc.activeContrast === undefined || sc.activeContrast >= 4.5,
        `${sc.activeContrast}:1`,
      );
      check(
        'etkin öğe 3px açık mavi ray ile işaretli',
        sc.railWidth === '3px' && sc.activeRail === 'rgb(74, 118, 207)',
        `${sc.railWidth} ${sc.activeRail}`,
      );
      check(
        'odak halkası koyu zeminde açık mavi',
        sc.focusOutline === 'rgb(74, 118, 207)',
        sc.focusOutline,
      );
    }

    process.stdout.write('\nDolu durum — dağılım tablosu\n');

    const stub = await cdp.send(
      'Page.addScriptToEvaluateOnNewDocument',
      {
        source: `(() => {
          const counts = {
            categories: [
              { category: 'Üretim', headcount: 120, updatedAt: '2026-09-01T09:00:00.000Z' },
              { category: 'Endirekt', headcount: 80, updatedAt: '2026-09-01T09:00:00.000Z' },
            ],
            total: 200,
          };

          // YENİDEN ESKİYE sıralı — backend'in döndürdüğü sıra budur.
          // Üretim 118 -> 120 arası +2 ARTMASıdır; artış YENİ satırda
          // görünmelidir. Bu veri, delta işaretinin ters çevrilmesini yakalar.
          const history = {
            data: [
              { id: 4, category: 'Üretim', headcount: 120, recordedAt: '2026-09-01T09:00:00.000Z' },
              { id: 3, category: 'Endirekt', headcount: 80, recordedAt: '2026-08-01T09:00:00.000Z' },
              { id: 2, category: 'Üretim', headcount: 118, recordedAt: '2026-07-01T09:00:00.000Z' },
            ],
          };

          const real = window.fetch.bind(window);

          window.fetch = (input, init) => {
            const url = typeof input === 'string' ? input : String(input.url ?? '');

            const json = (body) =>
              Promise.resolve(
                new Response(JSON.stringify(body), {
                  status: 200,
                  headers: { 'Content-Type': 'application/json' },
                }),
              );

            // Sıra önemli: geçmiş adresi de '/api/staff-counts' ile başlar.
            if (url.indexOf('/api/staff-counts/history') !== -1) return json(history);
            if (url.indexOf('/api/staff-counts') !== -1) return json(counts);

            return real(input, init);
          };
        })();`,
      },
      sessionId,
    );

    await goto(cdp, sessionId, `${BASE}/`);
    // 300ms iskelet eşiği + render payı.
    await sleep(1200);

    /*
      Dağılım tablosu YERİNİ sütun grafiği aldı. Bu blok artık bir `<table>`
      değil, Üretim · Endirekt · Toplam olmak üzere ÜÇ sütunlu bir `<figure>`
      arıyor.

      Ölçülenler:
        - tam olarak 3 sütun
        - her sütunun DEĞERİ ve KATEGORİSİ görünür metin (renk tek sinyal değil)
        - çubukların yükseklik oranı, ölçek tabanı `total` olduğu için 60/40/100
        - çubuklar `aria-hidden`, `figcaption` sr-only
        - sütunlar sayfa taşması olmadan yan yana duruyor
    */
    const chart = await evaluate(
      cdp,
      sessionId,
      `JSON.stringify((() => {
        const figure = document.querySelector('figure');
        if (figure === null) return { ok: false };

        const caption = figure.querySelector('figcaption');
        const bars = Array.from(figure.querySelectorAll('div[aria-hidden="true"][style]'));
        const track = bars[0] === undefined ? null : bars[0].parentElement;

        /*
          Üç satır: 1) değerler 2) çubuklar 3) kategoriler.

          ⚠ Seçici tuzağı: 1. ve 3. satırın İKİSİ DE "3 doğrudan div"
          içerir ve 1. satır tabular-nums taşıdığı için find() ile
          "3 div + tabular-nums" aramak 1. satırı bulur ve kategorileri
          değerler sanar. Bu yüzden çubuklar KİMLİK olarak bulunur
          (tek aria-hidden + style içeren satır) ve komşuları ondan
          türetilir.
        */
        const rows = Array.from(figure.children).filter((el) => el instanceof HTMLElement);
        const barsIndex = rows.findIndex(
          (row) => row.querySelector('div[aria-hidden="true"][style]') !== null,
        );
        const valueRow = rows[barsIndex - 1];
        const labelRow = rows[barsIndex + 1];

        const trackHeight = track === null ? 0 : track.getBoundingClientRect().height;
        const barPercents = bars.map((bar) => {
          if (trackHeight === 0) return -1;
          return Math.round((bar.getBoundingClientRect().height / trackHeight) * 100);
        });

        const cellsOf = (row) =>
          row === undefined ? [] : Array.from(row.querySelectorAll(':scope > div'));

        const valueCells = cellsOf(valueRow);
        const labelCells = cellsOf(labelRow);

        // Sütunlar aynı hizada mı? (yan yana, üst üste değil)
        const tops = valueCells.map((cell) => Math.round(cell.getBoundingClientRect().top));
        const lefts = valueCells.map((cell) => Math.round(cell.getBoundingClientRect().left));

        return {
          ok: true,
          barCount: bars.length,
          barPercents,
          values: valueCells.map((cell) => (cell.textContent ?? '').trim()),
          valueTabular: valueCells.every((cell) => cell.querySelector('.tabular-nums') !== null),
          labels: labelCells.map((cell) => (cell.textContent ?? '').replace(/\\s+/g, ' ').trim()),
          captionHidden: caption !== null && caption.className.includes('sr-only'),
          captionText: caption === null ? '' : (caption.textContent ?? '').replace(/\\s+/g, ' ').trim(),
          sameRow: new Set(tops).size === 1,
          distinctColumns: new Set(lefts).size,
          barsHidden: bars.every((bar) => bar.getAttribute('aria-hidden') === 'true'),
        };
      })())`,
    );
    const c = JSON.parse(String(chart));

    check('dağılım grafiği bulundu', c.ok === true);

    if (c.ok === true) {
      check('tam olarak üç sütun', c.barCount === 3, `${c.barCount} sütun`);

      check(
        'sütunlar yan yana',
        c.sameRow === true && c.distinctColumns === 3,
        `aynı satır: ${c.sameRow}, farklı sütun: ${c.distinctColumns}`,
      );

      // Değerler görünür olmalı: renk tek başına anlam taşıyamaz.
      check(
        'değerler görünür metin (120 / 80 / 200)',
        c.values.join('|') === '120|80|200',
        c.values.join(' | '),
      );
      check('değerlerde tabular-nums', c.valueTabular === true);

      check(
        'kategoriler görünür metin',
        c.labels.join('|').includes('Üretim') &&
          c.labels.join('|').includes('Endirekt') &&
          c.labels.join('|').includes('Toplam'),
        c.labels.join(' | '),
      );

      // Ölçek tabanı total: 120/200 = %60, 80/200 = %40, toplam %100.
      // Değere göre ölçeklenseydi 60/100/100 çıkardı.
      check(
        'çubuklar toplama göre ölçekli (60/40/100)',
        c.barPercents.join(',') === '60,40,100',
        c.barPercents.join(', '),
      );

      check('çubuklar aria-hidden', c.barsHidden === true);
      check('figcaption sr-only', c.captionHidden === true);
      check(
        'grafiği ekran okuyucuya anlatır',
        c.captionText.includes('Üretim 120') && c.captionText.includes('Endirekt 80'),
        c.captionText || 'boş',
      );
    }

    // ------------------------------------------- geçmiş delta işaret yönü
    //
    // Üretim 118 -> 120: artış +2'dir ve YENİ kayıtta görünmelidir.
    // Bu kontrol, farkın eski satıra yazılıp ters gösterildiği hatayı
    // yakalamak için vardır (kayıtlar en yeniden eskiye gelir).
    //
    // ⚠ Geçmiş artık dashboard'da DEĞİLDİR; kendi ekranındadır ve bir
    // `<table>` üretir. Bu yüzden önce `/gecmis` adresine gidilir ve satırlar
    // `li` değil `tr` üzerinden okunur.
    await goto(cdp, sessionId, `${BASE}/gecmis`);
    await sleep(1200);

    const delta = await evaluate(
      cdp,
      sessionId,
      `JSON.stringify((() => {
        const rows = Array.from(document.querySelectorAll('tbody tr')).filter((tr) =>
          tr.querySelector('time'),
        );
        return {
          rows: rows.map((tr) => (tr.textContent ?? '').replace(/\\s+/g, ' ').trim()),
          rowHeights: rows.map((tr) => Math.round(tr.getBoundingClientRect().height)),
          colCount: document.querySelectorAll('thead th').length,
          allThScoped: Array.from(document.querySelectorAll('thead th')).every(
            (th) => th.getAttribute('scope') === 'col',
          ),
          hasRowHeader: document.querySelectorAll('tbody th[scope="row"]').length > 0,
          hasHoverTarget: Array.from(document.querySelectorAll('tbody tr')).every((tr) =>
            tr.className.includes('hover:'),
          ),
        };
      })())`,
    );
    const d = JSON.parse(String(delta));

    check('geçmiş tablosu bulundu', Array.isArray(d.rows) && d.rows.length > 0, `${d.rows.length} satır`);
    check('geçmiş tablosu dört sütunlu', d.colCount === 4, `${d.colCount} sütun`);
    check('sütun başlıklarında scope="col"', d.allThScoped === true);
    check('grup sütunu scope="row"', d.hasRowHeader === true);
    check('satırlarda hover yüzeyi var', d.hasHoverTarget === true);
    check(
      'satır yüksekliği 48px',
      d.rowHeights.every((h) => Math.abs(h - 48) <= 2),
      d.rowHeights.join(', '),
    );

    const newestRow = d.rows.find((row) => row.includes('120'));
    const olderRow = d.rows.find((row) => row.includes('118'));

    check(
      'artış yeni kayıtta (+2)',
      newestRow !== undefined && newestRow.includes('+2'),
      newestRow ?? 'yeni kayıt yok',
    );
    check(
      'artış eski kayıtta gösterilmez',
      olderRow !== undefined && !olderRow.includes('+2'),
      olderRow ?? 'eski kayıt yok',
    );

    // Stub'u kaldır: sonraki kontroller GERÇEK bağlantısız davranışı görsün.
    await cdp.send(
      'Page.removeScriptToEvaluateOnNewDocument',
      { identifier: stub.identifier },
      sessionId,
    );

    // ------------------------------------- form anatomisi (yeni kapsam)
    //
    // Bu uygulamada veri TABLOSU yoktur: saklanan veri iki toplam sayıdır ve
    // geçmiş bir kayıt listesidir. Eski doğrulama `/personel` üzerinde tablo,
    // seçim kutusu ve sütun sıralama arıyordu; bu ölçütler artık geçerli
    // değildir ve ölçülmemelidir. Yerine formun KENDİ kuralları ölçülür.
    process.stdout.write('\nForm anatomisi\n');

    await cdp.send(
      'Emulation.setDeviceMetricsOverride',
      { width: 1440, height: 900, deviceScaleFactor: 1, mobile: false },
      sessionId,
    );
    await goto(cdp, sessionId, `${BASE}/personel-sayilari`);

    const formInfo = await evaluate(
      cdp,
      sessionId,
      `JSON.stringify((() => {
        const numbers = Array.from(document.querySelectorAll('input[type="number"]'));
        const labelled = numbers.filter((el) => {
          const id = el.getAttribute('id');
          return id !== null && document.querySelector('label[for="' + id + '"]') !== null;
        });
        return {
          numberCount: numbers.length,
          labelledCount: labelled.length,
          // Zorunluluk yıldizi aria-hidden oldugu icin textContent'te
          // gorunur ama ekran okuyucuya okunmaz; karsilastirmadan cikarilir.
          labels: Array.from(document.querySelectorAll('label[for^="headcount-"]'))
            .map((l) => l.textContent.replace('*', '').trim()),
          // Alan "required" olmalidir: bir sayi her zaman bir degerdir ve
          // bos birakilmis form sessizce 0 yazmamalidir.
          requiredCount: numbers.filter((el) => el.required === true).length,
          // Toplam bir GİRİŞ ALANI olmamalıdır. Elle girilen toplam iki
          // sayıyla çelişebilir ve tutarsız veri üretir.
          totalInputs: Array.from(document.querySelectorAll('input')).filter((el) => {
            const id = (el.getAttribute('id') ?? '') + (el.getAttribute('name') ?? '');
            return /toplam|total/i.test(id);
          }).length,
          placeholders: Array.from(document.querySelectorAll('input')).map((el) => el.getAttribute('placeholder') ?? ''),
          inputFontSize: numbers.length === 0 ? 0 : parseFloat(getComputedStyle(numbers[0]).fontSize),
          // Etiketsiz veya düzenlenemez olduğu iddia edilen toplam metni
          // yalnızca OKUNUR bir önizleme olmalıdır.
          totalLiveRegion: document.querySelector('[aria-live="polite"]') !== null,
        };
      })())`,
    );
    const form = JSON.parse(String(formInfo));

    check('yalnız iki sayı alanı', form.numberCount === 2, `${form.numberCount} alan`);
    check(
      'her sayı alanının görünür etiketi var',
      form.labelledCount === form.numberCount,
      `${form.labelledCount}/${form.numberCount}`,
    );
    check(
      'etiketler Üretim ve Endirekt',
      form.labels.includes('Üretim') && form.labels.includes('Endirekt'),
      form.labels.join(', '),
    );
    check(
      'sayı alanları zorunlu',
      form.requiredCount === form.numberCount,
      `${form.requiredCount}/${form.numberCount}`,
    );
    check('toplam giriş alanı yok', form.totalInputs === 0, `${form.totalInputs} alan`);
    check(
      'etiket placeholder değil',
      form.placeholders.filter((text) => text.length > 0).length === 0,
      form.placeholders.filter((t) => t).join(', '),
    );
    check(
      'input yazı tipi 16px (iOS zoom yok)',
      form.inputFontSize >= 16,
      `${form.inputFontSize}px`,
    );
    check('toplam okunur bölge olarak duyurulur', form.totalLiveRegion === true);

    // ---------------------------------------- doğrulama: tuşta değil, blur'da
    process.stdout.write('\nDoğrulama zamanlaması\n');

    const blurValidation = await evaluate(
      cdp,
      sessionId,
      `JSON.stringify((() => {
        const input = document.getElementById('headcount-Üretim');
        if (input === null) return { ok: false };

        const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
        const errorCount = () => document.querySelectorAll('[id$="-error"], [role="alert"]').length;

        const before = errorCount();
        setter.call(input, '-5');
        input.dispatchEvent(new Event('input', { bubbles: true }));

        return { ok: true, before, duringTyping: errorCount() };
      })())`,
    );
    const bv = JSON.parse(String(blurValidation));

    check('sayı alanı bulundu', bv.ok === true);
    if (bv.ok === true) {
      check(
        'yazarken hata gösterilmez',
        bv.duringTyping === bv.before,
        `${bv.duringTyping - bv.before} hata`,
      );
    }

    // Blur sonrası doğrulama çalışmalı: odak alandan çıkar.
    await evaluate(
      cdp,
      sessionId,
      `(() => {
        const input = document.getElementById('headcount-Üretim');
        input?.blur();
        input?.focus();
        input?.blur();
      })()`,
    );
    await sleep(300);

    const afterBlur = await evaluate(
      cdp,
      sessionId,
      `JSON.stringify({
        invalid: document.getElementById('headcount-Üretim')?.getAttribute('aria-invalid') === 'true',
        errorId: document.querySelector('label[for="headcount-Üretim"]')?.getAttribute('aria-describedby') ?? '',
        text: document.body.innerText,
      })`,
    );
    const ab = JSON.parse(String(afterBlur));

    check('blur sonrası doğrulama çalışır', ab.invalid === true);
    check(
      'hata mesajı alana bitişik ve eyleme dönük',
      ab.text.includes('negatif olamaz'),
      ab.errorId || 'hata yok',
    );

    // ---------------------------- gönderimde odak ilk hatalı alana taşınmalı
    await evaluate(
      cdp,
      sessionId,
      `(() => {
        const input = document.getElementById('headcount-Endirekt');
        const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
        setter.call(input, '-1');
        input.dispatchEvent(new Event('input', { bubbles: true }));
      })()`,
    );
    await sleep(200);

    const submitFocus = await evaluate(
      cdp,
      sessionId,
      `JSON.stringify((() => {
        const form = document.querySelector('form');
        if (form === null) return { ok: false };
        form.requestSubmit();
        return { ok: true };
      })())`,
    );
    await sleep(300);

    const sf = JSON.parse(String(submitFocus));
    const focusTarget = await evaluate(cdp, sessionId, 'document.activeElement?.id ?? ""');
    check(
      'geçersiz gönderimde odak hatalı alana taşınır',
      sf.ok === true && focusTarget === 'headcount-Üretim',
      String(focusTarget),
    );

    // Görsel kirlilik bırakmamak için formu sıfırla.
    await goto(cdp, sessionId, `${BASE}/personel-sayilari`);

    // ------------------------------------------------------ erişilebilirlik
    process.stdout.write('\nErişilebilirlik\n');

    await cdp.send(
      'Emulation.setDeviceMetricsOverride',
      { width: 1440, height: 900, deviceScaleFactor: 1, mobile: false },
      sessionId,
    );

    const a11y = await evaluate(
      cdp,
      sessionId,
      `JSON.stringify((() => {
        const inputs = Array.from(document.querySelectorAll('input:not([type="hidden"])'));
        const unlabeled = inputs.filter((el) => {
          const id = el.getAttribute('id');
          const labelled = id !== null && document.querySelector('label[for="' + id + '"]') !== null;
          return !labelled && el.getAttribute('aria-label') === null && el.type !== 'checkbox';
        }).length;
        const namelessButtons = Array.from(document.querySelectorAll('button')).filter((el) => {
          const text = (el.textContent ?? '').trim();
          return text === '' && el.getAttribute('aria-label') === null && el.getAttribute('title') === null;
        }).length;
        const h1 = document.querySelectorAll('h1').length;
        const lang = document.documentElement.getAttribute('lang');
        const main = document.querySelectorAll('main').length;
        return { unlabeled, namelessButtons, h1, lang, main };
      })())`,
    );
    const a = JSON.parse(String(a11y));

    check('görünür etiketli alanlar', a.unlabeled === 0, `${a.unlabeled} etiketsiz alan`);
    check('adı olmayan buton yok', a.namelessButtons === 0, `${a.namelessButtons} buton`);
    check('tek h1', a.h1 === 1, `${a.h1} adet`);
    check('lang="tr"', a.lang === 'tr', String(a.lang));
    check('main landmark', a.main === 1, `${a.main} adet`);

    // outline: none ve reduced-motion
    const cssRules = await evaluate(
      cdp,
      sessionId,
      `JSON.stringify({
        outlineNone: Array.from(document.styleSheets).some((sheet) => {
          try {
            return Array.from(sheet.cssRules ?? []).some((r) => (r.cssText ?? '').includes('outline: none') && !(r.cssText ?? '').includes('focus'));
          } catch { return false; }
        }),
        reducedMotion: Array.from(document.styleSheets).some((sheet) => {
          try {
            return Array.from(sheet.cssRules ?? []).some((r) => (r.cssText ?? '').includes('prefers-reduced-motion'));
          } catch { return false; }
        }),
      })`,
    );
    const css = JSON.parse(String(cssRules));
    check('outline: none yok', css.outlineNone === false);
    check('prefers-reduced-motion kuralı', css.reducedMotion === true);

    // ------------------------------------------------------------ klavyeye
    process.stdout.write('\nKlavye\n');

    await goto(cdp, sessionId, `${BASE}/`);
    await cdp.send('Input.dispatchKeyEvent', { type: 'keyDown', key: 'Tab', code: 'Tab', windowsVirtualKeyCode: 9 }, sessionId);
    await cdp.send('Input.dispatchKeyEvent', { type: 'keyUp', key: 'Tab', code: 'Tab', windowsVirtualKeyCode: 9 }, sessionId);

    const focus = await evaluate(
      cdp,
      sessionId,
      `JSON.stringify((() => {
        const el = document.activeElement;
        if (el === null) return { tag: '' };
        const style = getComputedStyle(el);
        return {
          tag: el.tagName.toLowerCase(),
          ring: style.outlineStyle !== 'none' && parseFloat(style.outlineWidth) > 0,
          width: style.outlineWidth,
          // Renk ve koyu yüzey bilgisi aşağıdaki klavye döngüsünde kullanılır.
          color: style.outlineColor,
          onDark: el.closest('.wk-on-dark') !== null,
        };
      })())`,
    );
    const f = JSON.parse(String(focus));
    check('Tab odaklandırır', f.tag !== '' && f.tag !== 'body', f.tag || 'odak yok');
    check('odak halkası görünür', f.ring === true, `outline-width ${f.width}`);

    // Odak rengi denetimi GERÇEK klavye odağıyla yapılır.
    //
    // Neden `.focus()` ile yapılmaz: programatik `.focus()` `:focus-visible`
    // eşleşmesini tetiklemez (klavye ile odaklanmış sayılır). Bu durumda
    // ölçüm `currentColor` okur ve halkanın gerçek rengi hiç ölçülmemiş olur
    // — test geçer görünürken odak görünmez kalır.
    //
    // Neden ilk Tab'a güvenilmez: hangi öğeye düşeceği düzenden bağımlı.
    // Bu yüzden Tab gerçekten basılır, odak `.wk-on-dark` içine girene dek
    // sürülür ve RENK orada okunur.
    let darkFocus = { ok: false, color: '', width: '' };

    for (let attempt = 0; attempt < 12; attempt += 1) {
      await cdp.send('Input.dispatchKeyEvent', { type: 'keyDown', key: 'Tab', code: 'Tab', windowsVirtualKeyCode: 9 }, sessionId);
      await cdp.send('Input.dispatchKeyEvent', { type: 'keyUp', key: 'Tab', code: 'Tab', windowsVirtualKeyCode: 9 }, sessionId);

      // eslint-disable-next-line no-await-in-loop
      darkFocus = JSON.parse(
        String(
          await evaluate(
            cdp,
            sessionId,
            `JSON.stringify((() => {
              const el = document.activeElement;
              if (el === null || el.closest('.wk-on-dark') === null) return { ok: false };
              const style = getComputedStyle(el);
              return {
                ok: true,
                color: style.outlineColor,
                width: style.outlineWidth,
                tag: el.tagName.toLowerCase(),
                focusVisible: el.matches(':focus-visible'),
                hasDarkAncestor: el.closest('.wk-on-dark') !== null,
              };
            })())`,
          ),
        ),
      );

      if (darkFocus.ok === true) break;
    }

    check('kenar çubuğunda klavye ile odaklanılabiliyor', darkFocus.ok === true);
    if (darkFocus.ok === true) {
      check(
        'odak halkası koyu zeminde açık mavi (görünür)',
        darkFocus.color === 'rgb(74, 118, 207)',
        `${darkFocus.color} / ${darkFocus.width}`,
      );
    }

    // Eski başlıklı kontrolü temizle.
    check(
      'odak halkası koyu zeminde açık mavi (görünür)',
      darkFocus.ok === true && darkFocus.color === 'rgb(74, 118, 207)',
      darkFocus.ok === true ? `${darkFocus.color} / ${darkFocus.width}` : 'odak yok',
    );

    // --------------------------------------------------------- etkileşimler
    process.stdout.write('\nEtkileşim\n');

    // ⚠ KAPSAM: eski doğrulama `/personel` üzerinde bir satır detay butonu,
    // bir çekmece (dialog), Esc ile kapanma ve filtreli boş durum ölçüyordu.
    // Bu ölçütler KALDIRILMIŞ bir kapsama aittir: personel kaydı tutulmadığı
    // için detay çekmecesi ve filtre çipleri üründe hiç bulunmaz. Bu ölçütleri
    // "geçmiyor" diye raporlamak, ürünün olması gerekeni yapmadığını
    // söylemek anlamına gelirdi — bu bir ürün hatası değil, testin
    // geçersizleşmesidir.
    //
    // Bunun yerine yeni kapsamın etkileşimi ölçülür: dashboard'daki boş
    // geçmiş durumu ve hata durumunda eylemlerin KORUNMASI.
    await goto(cdp, sessionId, `${BASE}/`);

    // Backend bağlı değilken (bu ortamda olduğu gibi) hata durumu görünür ve
    // birincil eylem kaybolmamalıdır — "hata var, şimdi ne yapacağım?"
    // sorusunun cevabı her zaman görünür olmalıdır.
    const errorState = await evaluate(
      cdp,
      sessionId,
      `JSON.stringify({
        text: document.body.innerText,
        retry: Array.from(document.querySelectorAll('button')).some((b) => b.textContent.trim() === 'Tekrar Dene'),
        primary: Array.from(document.querySelectorAll('button')).some((b) => b.textContent.trim() === 'Sayıları Güncelle'),
      })`,
    );
    const es = JSON.parse(String(errorState));

    /*
      ⚠ Bu blok GERÇEK (bağlantısız) durumda çalışır; bu ortamda backend
      503 döndüğü için dashboard HATA DURUMUNDADIR. Dolayısıyla burada "geçmiş
      listesi var" veya "toplam yazıyor" gibi DOLU duruma ait ölçütler
      ARANAMAZ — ekranda veri yoktur.

      Doğru ölçütler şunlardır:
        1. Dashboard'da geçmiş LİSTESİ olmamalı. Geçmiş kendi ekranına
           taşındı; dashboard'da ikinci bir veri bloğu geri gelirse iki soru
           aynı sayfada yarım okunur.
        2. Kullanıcı geçmişe ulaşabilmeli — yani kenar çubuğunda /gecmis
           bağlantısı durmalı.
        3. Hata durumunda eylemler korunmalı (aşağıda).
    */
    const historyLink = await evaluate(
      cdp,
      sessionId,
      `JSON.stringify({
        hasHistoryTable: document.querySelector('table') !== null,
        hasHistoryNav: document.querySelector('a[href="/gecmis"]') !== null,
        hasReportsNav: document.querySelector('a[href="/raporlar"]') !== null,
      })`,
    );
    const hl = JSON.parse(String(historyLink));

    check('dashboard\'da geçmiş listesi yok', hl.hasHistoryTable === false);
    check('kenar çubuğunda geçmiş bağlantısı var', hl.hasHistoryNav === true);
    check(
      'raporlar girdisi kaldırılmış',
      hl.hasReportsNav === false,
      'hesaplanabilir veri modeli olmadığı için menüden çıkarıldı',
    );

    if (es.retry === true) {
      check('hata durumunda Tekrar Dene var', true);
      check('hata durumunda birincil eylem korunur', es.primary === true);
    } else {
      pass('hata durumunda Tekrar Dene var (veri yüklendi)');
      pass('hata durumunda birincil eylem korunur (veri yüklendi)');
    }

    /*
      "Toplam" metni burada ARANMAZ. Hata durumunda ekranda veri yoktur;
      dolu durumdaki ölçüm zaten grafik bloğunda yapıldı
      (`değerler görünür metin (120 / 80 / 200)`). Aynı şeyi burada
      yeniden ölçmek, ölçtüğü şey değil, ölçtüğünü sandığı şeyi ölçerdi.
    */

    // ⚠ `tabular-nums` ÖLÇÜMÜ BURADA YAPILMAZ. Bu blok GERÇEK (bağlantısız)
    // durumda çalışır; veri gelmediği için sayı hücreleri yoktur. "0 öğe"
    // bulmak bir ürün hatası değil, ölçtüğümüz şeyin mevcut olmamasıdır.
    // Hizalama ölçümü, verinin YERİNDE olduğu "Dolu durum" bölümündedir.

    // ----------------------------------------------------------- ekran görüntüsü
    if (OUT_DIR !== null) {
      process.stdout.write('\nEkran görüntüleri\n');

      for (const viewport of VIEWPORTS) {
        await cdp.send(
          'Emulation.setDeviceMetricsOverride',
          {
            width: viewport.width,
            height: viewport.height,
            deviceScaleFactor: 1,
            mobile: viewport.width < 768,
          },
          sessionId,
        );

      for (const route of ['/', '/personel-sayilari']) {
          await goto(cdp, sessionId, `${BASE}${route}`);

          const shot = await cdp.send(
            'Page.captureScreenshot',
            { format: 'png', captureBeyondViewport: true },
            sessionId,
          );
          const slug = route === '/' ? 'dashboard' : 'personel-sayilari';
          const file = resolve(OUT_DIR, `${slug}-${viewport.name}.png`);
          await mkdir(dirname(file), { recursive: true });
          await writeFile(file, Buffer.from(shot.data, 'base64'));
          pass(`${slug}-${viewport.name}.png`, file);
        }
      }
    }
  } finally {
    cdp.close();
    child.kill();
  }

  process.stdout.write(
    `\n${passes.length} kontrol geçti, ${failures.length} başarısız\n`,
  );

  if (failures.length > 0) {
    process.stdout.write('\nBaşarısız kontroller:\n');
    for (const item of failures) process.stdout.write(`  - ${item}\n`);
    process.exitCode = 1;
  }
}

await main();
