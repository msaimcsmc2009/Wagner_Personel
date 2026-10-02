# brand.md — Wagner Kablo visual identity for product UI

## 1. Who we are

Wagner Kablo A.Ş. — automotive wire-harness manufacturer, founded **1992**,
Antalya Free Zone, Türkiye. ~700 employees, Tier 1/2 supplier to the automotive
industry. Operates under lean manufacturing and lean management since 2007.
Quality management, corporate governance and environmental management systems
are formal and audited (incl. VDA 6.3).

**What this means for interface design:** the users are engineers, HR specialists
and plant managers. They handle dense operational data — employee records,
departments, leave, training, approvals. The interface should feel like reliable
industrial software: precise, calm, legible, fast. It should feel like something
a quality auditor would be comfortable seeing on a screen.

- Product type: B2B internal tool (HR / personnel management)
- Session shape: long, repeated, multi-hour daily use
- Density: medium-to-high (tables dominate)
- Language: **Turkish primary**, English secondary
- Priority: legibility and speed > decoration

## 2. How this palette was determined

The local repository was empty at the time this system was authored, so the
palette was **not invented**. It was recovered from Wagner Kablo's own
production assets. Evidence, in order of authority:

| Source | Finding |
| --- | --- |
| `wagner.com.tr` → `css/style.css` | `#header { background-color: #092c74; }` — main site header |
| `wagner.com.tr` → `aboutus.html` | inline `style="color:#092C74"` on the page `<h1>` |
| `wagner.com.tr` → `css/style.css` | `h1..h6 > span` → `color: #092C74` — the accent word in every heading |
| `wagner.com.tr` → `css/style.css` | submenu/megamenu `border-top: 2px solid #092c74` |
| `manage.wagner.com.tr` → `assets/css/variable.css` | `--iq-border-light: #092c74` — the brand navy, hand-entered into the admin theme |
| `wagner.com.tr` → `images/logo.png` | white wordmark (155×100) — designed to sit on `#092C74` |

**Conclusion: `#092C74` is the authentic Wagner Kablo corporate navy.** Four
independent production locations agree. Everything in `colors.md` is derived
from it at a single hue (H 220°), so the ramp is provably coherent rather than
eyeballed.

### Colours that were rejected

Discovered during analysis and **deliberately excluded**:

- `#850aa3` (purple) — the *stock template default* in the admin panel's
  `variable.css`, not a Wagner colour. It is also internally inconsistent: the
  template declares `--iq-primary-rgb: 100, 114, 248`, which does not match its
  own `--iq-primary: #850aa3`. This is exactly the generic-template drift this
  system exists to eliminate. **Do not reintroduce purple.**
- `#1ABC9C` (teal) — 92 occurrences in the corporate site, but it is the
  un-overridden default of the third-party `Canvas`/`Metro` theme. Unreliable
  provenance, and it fights the navy. Not used.
- `#2B587A`, `#3F729B`, `#0E4984`, `#27537A`, `#34526F`, `#131A30`, `#126567` —
  these are the **VK / Tumblr / StatusNet / Drupal / Bitbucket / Xing /
  Instagram** brand colours from a social-icon block. Not Wagner blues.
- `#092C74` was also verified as a legitimate Pantone-adjacent navy family
  colour, consistent with the "Sax Blue / corporate navy" convention used across
  the Turkish cable & connector industry.

## 3. Logo

- The wordmark is **white**, designed for a navy field. On light surfaces use
  the dark/navy version; never place the white logo on white.
- Minimum clear space on all sides ≈ the height of the "W".
- Never recolour, stretch, outline, add effects to, or rebuild the logo in CSS.
- Never use the logo as a UI background image, watermark or texture.
- Minimum size: 24px height for the compact/sidebar variant.

## 4. Tone and voice (UI copy)

Wagner Kablo's stated values: *be honest, respect every stakeholder, be lean,
be a team, respect the environment, respect ethical values.* Mirror that in
interface copy.

- **Plain, direct, technical.** Operator language, not marketing language.
  "Personel kaydı silindi" — not "Kaydınız başarıyla ortadan kaldırıldı 🎉"
- **No exclamation marks** in system messages. No emoji in product UI.
- **Say what happened and what is recoverable.** Errors must be actionable.
- **Use the user's vocabulary.** Personel, departman, izin, bordro, vardiya,
  eğitim — not "employee", "unit", "leave" unless the screen is the English one.
- **Timestamps absolute.** "14.03.2026 09:42". Never "2 hours ago" in an
  audit context.
- Buttons name the action: **"Personel Ekle"**, not "Tamam" or "Gönder".

## 5. The distribution rule

> Neutral surfaces carry the interface. Brand blue is an accent.

A healthy Wagner Kablo screen is roughly **70% white/neutral, 20% grey, 10%
blue**. Concretely:

- **Do** use navy for: primary button, active sidebar item, current breadcrumb
  link, focus ring, primary chart series, selected left-border accents
- **Do** use light blue for: selected/hover table row, sidebar active background,
  info panel background, subtle chips, chart gridlines
- **Do not** paint: full-width navy page sections, navy page backgrounds, navy
  every card, gradient headers on every page, blue body text

A screen that is mostly blue is not on-brand — it is a marketing page. Product
UI is not a marketing page.

## 6. What this brand is not

Wagner Kablo is an industrial manufacturer, not a startup or a game studio.
The following are categorically wrong and must never appear:

neon / electric colors · cyberpunk · gaming HUD · excessive glassmorphism ·
"futuristic" chrome · holographic gradients · glow and bloom · animated
backgrounds · purple-blue AI gradient · emoji in data views

The correct reference points are: a well-made ERP, a quality-management system,
a modern industrial HMI. Calm, dense, precise, trustworthy.
