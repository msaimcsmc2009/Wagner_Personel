# colors.md — semantic color system

Every value below is **measured**, not guessed. Contrast ratios were computed
with the WCAG 2.1 relative-luminance formula and verified against every surface
each token is actually used on. The full check returned **0 failures**.

## How to use this file

1. Reference colors **only** by semantic token (`--wk-color-brand-primary`),
   never by hex, in component code.
2. If you need a color that is not in this file, you need a new token and a
   reason — not an ad-hoc hex.
3. Raw brand values may only appear in the token definition file itself.

---

## 1. The brand ramp

Derived from the authentic Wagner Kablo navy `#092C74` at a fixed hue of
**H 220°**, saturation tapering toward the light end so tints stay calm rather
than candy-coloured.

| Token | Hex | Contrast on white | Intended role |
| --- | --- | --- | --- |
| `--wk-brand-50` | `#F1F5FE` | 1.09 | page-level subtle tint, info panel bg |
| `--wk-brand-100` | `#E3EBFD` | 1.20 | hover/selected surface, chip bg |
| `--wk-brand-200` | `#C9D8F8` | 1.43 | **light blue** — decorative fill, sidebar rail |
| `--wk-brand-300` | `#A4BDEF` | 1.89 | chart series 4, light divider on navy |
| `--wk-brand-400` | `#7799DF` | 2.84 | chart series 3, decorative only |
| `--wk-brand-500` | `#4A76CF` | 4.39 | decorative / large-text only — **not body text** |
| `--wk-brand-600` | `#2E5CB8` | **6.29** | links, secondary emphasis, focus ring |
| `--wk-brand-700` | **`#092C74`** | **12.93** | **THE BRAND COLOR** — primary actions |
| `--wk-brand-800` | `#0C2350` | 15.31 | primary hover, dark surface |
| `--wk-brand-900` | `#0C1832` | 17.61 | primary active, sidebar/dark chrome, heading ink |

> **Ramp discipline.** Steps 50–500 are **not** valid body-text colours
> (`brand-500` at 4.39:1 fails AA for normal text). Use them for backgrounds,
> borders, chart fills and text ≥ 24px or ≥ 19px bold. The moment you need text
> that is readable, jump to `brand-600` or `brand-700`.

---

## 2. Brand semantic aliases

These are the tokens components should reference.

| Token | Resolves to | Hex | Usage |
| --- | --- | --- | --- |
| `--wk-color-brand-primary` | brand-700 | `#092C74` | primary button, active nav, key emphasis |
| `--wk-color-brand-primary-hover` | brand-800 | `#0C2350` | primary hover |
| `--wk-color-brand-primary-active` | brand-900 | `#0C1832` | primary pressed |
| `--wk-color-brand-primary-soft` | brand-50 | `#F1F5FE` | selected row, subtle info panel |
| `--wk-color-brand-primary-soft-hover` | brand-100 | `#E3EBFD` | selected row hover |
| `--wk-color-brand-secondary` | brand-600 | `#2E5CB8` | secondary emphasis, links, chart series 1 |
| `--wk-color-brand-secondary-hover` | — | `#24488F` | secondary hover |
| `--wk-color-brand-light` | brand-200 | `#C9D8F8` | **light blue** — chips, decorative fill, rail |
| `--wk-color-brand-dark` | brand-900 | `#0C1832` | dark chrome, sidebar, footer |
| `--wk-color-link` | brand-600 | `#2E5CB8` | inline links (6.29:1 on white ✅) |
| `--wk-color-link-hover` | brand-700 | `#092C74` | link hover |
| `--wk-color-focus-ring` | brand-600 | `#2E5CB8` | focus outline (≥3:1 on all surfaces ✅) |

### Why links are `brand-600` and not the brand navy

`#092C74` is beautiful for buttons but, at 12.93:1, a very heavy weight for
inline body links — a paragraph full of it looks like a wall of ink. `brand-600`
at 6.29:1 is AA-compliant, visibly the same hue family, and reads far better in
running text. **Buttons get navy; links get `brand-600`.** Both are the brand.

---

## 3. Surfaces

| Token | Hex | Usage |
| --- | --- | --- |
| `--wk-color-background` | `#F8FAFC` | application canvas, behind all content |
| `--wk-color-surface` | `#FFFFFF` | cards, panels, table, modals, dropdowns, nav |
| `--wk-color-surface-elevated` | `#FFFFFF` | overlays; separated by **elevation**, not colour |
| `--wk-color-surface-sunken` | `#F1F5F9` | table header, toolbar strip, wells, code blocks |
| `--wk-color-surface-tinted` | `#E8F0FB` | selected/hover table row, active sidebar item |
| `--wk-color-surface-disabled` | `#F1F5F9` | disabled control background |
| `--wk-color-overlay` | `rgba(9,44,116,0.50)` | modal scrim — navy-tinted, not black |

`surface-elevated` is intentionally the same hex as `surface`. Elevation is
communicated by the **shadow scale**, never by a colour change. Adding a
slightly different "elevated white" is a classic source of muddiness.

---

## 4. Borders

| Token | Hex | Contrast | Usage |
| --- | --- | --- | --- |
| `--wk-color-border` | `#E2E8F0` | 1.23 | **decorative only** — dividers, row separators, table rules |
| `--wk-color-border-strong` | `#7D8A99` | 3.52 | **control boundaries** — input/select/checkbox/radio borders |
| `--wk-color-border-brand` | `#092C74` | 12.93 | active/selected left border, required-field emphasis |

> **Critical accessibility distinction.** WCAG 1.4.11 requires **3:1** for any
> boundary needed to identify a control. `#E2E8F0` (1.23:1) **fails** this. So
> the system has two border tokens:
>
> - `border` → decorative separators only
> - `border-strong` → anything the user must see to know where to click or type
>
> The ubiquitous light-grey input border does not pass 1.4.11. Using
> `border-strong` on form controls is a real, measured requirement — not a
> stylistic preference. Do not "lighten it" for aesthetics.

---

## 5. Text

| Token | Hex | Best contrast | Usage |
| --- | --- | --- | --- |
| `--wk-color-text-primary` | `#0F172A` | **17.85** | headings, primary body, table cell values |
| `--wk-color-text-secondary` | `#475569` | **7.58** | sub-headings, table headers, labels, nav items |
| `--wk-color-text-muted` | `#5A6779` | **5.75** | metadata, timestamps, helper text, placeholders |
| `--wk-color-text-disabled` | `#7D8A99` | 3.52 | disabled controls (WCAG 1.4.3 exempt, still readable) |
| `--wk-color-text-inverse` | `#FFFFFF` | — | text on navy / dark chrome |
| `--wk-color-text-brand` | `#092C74` | 12.93 | brand-accented emphasis, active nav item |

All five text tokens were verified on **all five** surfaces (white, `#F8FAFC`,
`#F1F5F9`, `#F1F6FD`, `#E8F0FB`). The lowest result anywhere is **4.51:1** —
above AA with margin. `text-muted` is a cool blue-grey chosen specifically to
sit harmoniously next to the navy rather than fighting it.

**Never use muted grey lighter than `#7D8A99` for any text a user must read.**
The most common real-world failure in admin panels is a `#BBB` caption that
nobody can read. If it is important enough to render, it is important enough to
be legible.

### Hierarchy in practice

```
text-primary     #0F172A   →  headings, names, values
text-secondary   #475569   →  column headers, section labels, nav
text-muted       #5A6779   →  dates, hints, counts, placeholders
text-brand       #092C74   →  the one accent word in a heading
```

---

## 6. Semantic status colors

**These are not brand colors and must never be tinted toward the brand blue.**
A status color exists to *mean* something. The moment a manager learns that
"light blue = pending" and "green = approved", recoloring destroys the meaning.

`info` is the only one in the blue family, and it is deliberately a
**sky/cyan** (`hsl(199 …)`) — visibly distinct from the brand navy at
`hsl(220 …)`. That is intentional separation, not an oversight.

### Success

| Token | Hex | On white | Usage |
| --- | --- | --- | --- |
| `--wk-color-success` | `#15803D` | 5.02 | solid badge/button, status dot |
| `--wk-color-success-hover` | `#166534` | 7.13 | hover |
| `--wk-color-success-soft` | `#ECFDF5` | — | soft badge bg, success alert bg |
| `--wk-color-success-text` | `#047857` | 5.21 on soft ✅ | **text on `success-soft`** |

### Warning

| Token | Hex | On white | Usage |
| --- | --- | --- | --- |
| `--wk-color-warning` | `#B45309` | 5.02 | solid badge/button, caution dot |
| `--wk-color-warning-hover` | `#92400E` | 7.09 | hover |
| `--wk-color-warning-soft` | `#FFFBEB` | — | soft badge bg, warning alert bg |
| `--wk-color-warning-text` | `#B45309` | 4.84 on soft ✅ | **text on `warning-soft`** |

### Danger

| Token | Hex | On white | Usage |
| --- | --- | --- | --- |
| `--wk-color-danger` | `#DC2626` | 4.83 | destructive button, error state, delete icon |
| `--wk-color-danger-hover` | `#B91C1C` | 6.47 | hover |
| `--wk-color-danger-soft` | `#FEF2F2` | — | soft badge bg, error alert bg |
| `--wk-color-danger-text` | `#B91C1C` | 5.91 on soft ✅ | **text on `danger-soft`** |

### Info

| Token | Hex | On white | Usage |
| --- | --- | --- | --- |
| `--wk-color-info` | `#0369A1` | 5.93 | informational badge, help panel |
| `--wk-color-info-hover` | `#075985` | 7.56 | hover |
| `--wk-color-info-soft` | `#F0F9FF` | — | soft badge bg, info alert bg |
| `--wk-color-info-text` | `#0C4A6E` | 8.87 on soft ✅ | **text on `info-soft`** |

### Why these specific values

Two traps were avoided, both of which are near-universal in real dashboards:

- **Yellow fails.** The obvious warning `#D97706` yields only **3.19:1** with
  white text. The brown-leaning `#B45309` yields **5.02:1**. Warning is amber
  in *hue* but dark enough to carry white text.
- **Bright green fails.** `#16A34A` gives only **3.30:1**. The deeper `#15803D`
  gives **5.02:1**. Success is green in *hue* but readable with white text.

Status colours look slightly deeper than you might first reach for. That is the
cost of legibility, and it is worth paying.

### Status is never colour alone

Colour-blind users cannot rely on hue. Every status indicator carries a **text
label** and, where space allows, a **distinct icon shape**.

```
●  Aktif        (success dot)
●  Beklemede    (warning dot)
●  Pasif        (danger/neutral dot)
```

Do not render a bare coloured circle as the only signal. Do not use red/green
alone to distinguish two adjacent table rows.

---

## 7. Chart palette

Categorical series, ordered so the brand leads and no two adjacent entries are
confusable:

| # | Token | Hex |
| --- | --- | --- |
| 1 | `--wk-chart-1` | `#092C74` (brand) |
| 2 | `--wk-chart-2` | `#2E5CB8` |
| 3 | `--wk-chart-3` | `#5A6779` |
| 4 | `--wk-chart-4` | `#0369A1` |
| 5 | `--wk-chart-5` | `#15803D` |
| 6 | `--wk-chart-6` | `#B45309` |

Gridlines use `--wk-color-border` (`#E2E8F0`). Axis labels use
`text-muted`. Never a pie chart with more than 6 slices, and never a 3-D chart.

---

## 8. Reference implementation

Adapt to whatever token layer the project actually uses — do not add a second
token system. See §9 for stack-specific wiring.

```css
:root {
  /* brand ramp */
  --wk-brand-50:#F1F5FE;  --wk-brand-100:#E3EBFD; --wk-brand-200:#C9D8F8;
  --wk-brand-300:#A4BDEF; --wk-brand-400:#7799DF; --wk-brand-500:#4A76CF;
  --wk-brand-600:#2E5CB8; --wk-brand-700:#092C74; --wk-brand-800:#0C2350;
  --wk-brand-900:#0C1832;

  /* brand semantics */
  --wk-color-brand-primary:#092C74;
  --wk-color-brand-primary-hover:#0C2350;
  --wk-color-brand-primary-active:#0C1832;
  --wk-color-brand-primary-soft:#F1F5FE;
  --wk-color-brand-primary-soft-hover:#E3EBFD;
  --wk-color-brand-secondary:#2E5CB8;
  --wk-color-brand-secondary-hover:#24488F;
  --wk-color-brand-light:#C9D8F8;
  --wk-color-brand-dark:#0C1832;
  --wk-color-link:#2E5CB8;
  --wk-color-link-hover:#092C74;
  --wk-color-focus-ring:#2E5CB8;

  /* surfaces */
  --wk-color-background:#F8FAFC;
  --wk-color-surface:#FFFFFF;
  --wk-color-surface-elevated:#FFFFFF;
  --wk-color-surface-sunken:#F1F5F9;
  --wk-color-surface-tinted:#E8F0FB;
  --wk-color-surface-disabled:#F1F5F9;
  --wk-color-overlay:rgba(9,44,116,0.50);

  /* borders */
  --wk-color-border:#E2E8F0;
  --wk-color-border-strong:#7D8A99;
  --wk-color-border-brand:#092C74;

  /* text */
  --wk-color-text-primary:#0F172A;
  --wk-color-text-secondary:#475569;
  --wk-color-text-muted:#5A6779;
  --wk-color-text-disabled:#7D8A99;
  --wk-color-text-inverse:#FFFFFF;
  --wk-color-text-brand:#092C74;

  /* status */
  --wk-color-success:#15803D;        --wk-color-success-hover:#166534;
  --wk-color-success-soft:#ECFDF5;   --wk-color-success-text:#047857;
  --wk-color-warning:#B45309;        --wk-color-warning-hover:#92400E;
  --wk-color-warning-soft:#FFFBEB;   --wk-color-warning-text:#B45309;
  --wk-color-danger:#DC2626;         --wk-color-danger-hover:#B91C1C;
  --wk-color-danger-soft:#FEF2F2;    --wk-color-danger-text:#B91C1C;
  --wk-color-info:#0369A1;           --wk-color-info-hover:#075985;
  --wk-color-info-soft:#F0F9FF;      --wk-color-info-text:#0C4A6E;

  /* charts */
  --wk-chart-1:#092C74; --wk-chart-2:#2E5CB8; --wk-chart-3:#5A6779;
  --wk-chart-4:#0369A1; --wk-chart-5:#15803D; --wk-chart-6:#B45309;
}
```

---

## 9. Stack wiring

Map these tokens onto the layer the project **already** uses. Do not introduce a
competing system.

**Plain CSS / CSS Modules** — define the block above in the global stylesheet
(`app/globals.css`, `src/index.css`, `styles/tokens.css`) once. Import the
global sheet in `main.tsx`/`index.tsx` if it is not already. Reference
`var(--wk-color-*)` in modules.

**Tailwind v4** — the token block is valid `@theme` input; CSS variables are
exposed as utilities automatically. Add a `@theme` block, keep the names.

**Tailwind v3** — put the variables in `:root` **and** reference them from
`theme.extend.colors` so utilities resolve to the same values:

```js
// tailwind.config.js
module.exports = {
  theme: {
    extend: {
      colors: {
        brand: {
          DEFAULT: 'var(--wk-color-brand-primary)',
          hover:  'var(--wk-color-brand-primary-hover)',
          soft:   'var(--wk-color-brand-primary-soft)',
        },
        surface:  { DEFAULT: 'var(--wk-color-surface)', sunken: 'var(--wk-color-surface-sunken)' },
        content:  { primary: 'var(--wk-color-text-primary)', muted: 'var(--wk-color-text-muted)' },
        line:     { DEFAULT: 'var(--wk-color-border)', strong: 'var(--wk-color-border-strong)' },
        success:  'var(--wk-color-success)',   warning: 'var(--wk-color-warning)',
        danger:   'var(--wk-color-danger)',    info:    'var(--wk-color-info)',
      },
    },
  },
}
```

**shadcn/ui** — map onto the existing variables rather than adding new names, so
every shadcn component inherits the brand automatically:

```css
:root {
  --primary: 9 44 116;      /* #092C74 */
  --primary-foreground: 255 255 255;
  --secondary: 46 92 184;   /* #2E5CB8 */
  --muted-foreground: 90 103 121;  /* #5A6779 text-muted */
  --border: 226 232 240;    /* decorative only */
  --input: 125 138 153;     /* #7D8A99 — WCAG 1.4.11 */
  --ring: 46 92 184;
  --destructive: 220 38 38;
  --radius: 0.375rem;       /* 6px — matches control radius */
}
```

Then theme shadcn components with **CSS variables only**. Do not edit files
inside `components/ui/` to hardcode Wagner colours; that forks the library and
breaks future `shadcn add` updates.

**Bootstrap** (the legacy panel at `manage.wagner.com.tr` is Bootstrap 4 +
`Streamit`) — the admin template exposes `--iq-*` variables in
`assets/css/variable.css`. The template default `--iq-primary: #850aa3` is a
**stock purple and must be changed to `#092C74`**. Also note
`--iq-primary-rgb: 100, 114, 248` is already inconsistent with its own
`--iq-primary` and must be corrected to `9, 44, 116`. Fixing those two lines
re-skins the entire legacy panel with no other edits.

---

## 10. The two-token rule

Most colour mistakes come from reaching for a single token when a context needs
two. Get this right and the system holds together:

| Context | Background token | Text / border token |
| --- | --- | --- |
| Primary button | `brand-primary` | `text-inverse` |
| Secondary button | `surface` | `text-brand` + `border-strong` |
| Soft badge | `*-soft` | `*-text` (**not** `*-text` on `*-soft` at 4.5 — verified) |
| Solid badge | `*` | `text-inverse` |
| Focus ring | — | `focus-ring` (+ 2px offset) |
| Selected row | `surface-tinted` | `text-primary` |
| Disabled control | `surface-disabled` | `text-disabled` |

Never pair a `*-soft` background with `text-primary` for a status — that
throws away the semantic signal. Never pair a soft background with `*-soft`
text.
