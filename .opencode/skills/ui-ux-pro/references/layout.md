# layout.md — application shell and page structure

## 1. The shell

Standard B2B admin structure. One shell, used by every authenticated page.

```
┌────────────────────────────────────────────────────────────────┐
│ SIDEBAR 256px │  TOPBAR 64px                                    │
│ (navy #0C1832)├────────────────────────────────────────────────┤
│               │ BREADCRUMB  (optional, 40px)                  │
│  ● Logo       ├────────────────────────────────────────────────┤
│               │ PAGE HEADER  (title + actions, 72px)           │
│  ▸ Personel   ├────────────────────────────────────────────────┤
│  ▸ Departman  │ TOOLBAR / FILTERS (optional, 64px)            │
│  ▸ İzin       ├────────────────────────────────────────────────┤
│  ▸ Eğitim     │ CONTENT AREA                                    │
│               │   max-width 1440px · padding 24/32             │
│  ─────────    │   background #F8FAFC                            │
│  👤 Kullanıcı │                                                 │
└────────────────────────────────────────────────────────────────┘
```

| Region | Surface | Notes |
| --- | --- | --- |
| Sidebar | `--wk-color-brand-dark` `#0C1832` | the one large navy surface in the product |
| Topbar | `--wk-color-surface` `#FFFFFF` | + `border-bottom` `--wk-color-border` |
| Breadcrumb | transparent | sits above page header |
| Page header | transparent | `h1` + right-aligned actions |
| Toolbar | `--wk-color-surface` or transparent | search / filters / view switch |
| Content | `--wk-color-background` `#F8FAFC` | the canvas |

**The sidebar is the only big navy block.** Everything else is white or light
grey. This is how you get brand presence without a blue-heavy interface.

---

## 2. Sidebar

- Width 256px expanded, 64px icon rail collapsed, overlay drawer on mobile.
- Background `brand-dark`; section labels in `rgba(255,255,255,0.5)` uppercase
  `--wk-text-caption`.
- **Item height 40px, padding 0 16px, radius `--wk-radius-sm` 4px.**
- Default item: `rgba(255,255,255,0.78)` text.
- Hover: `rgba(255,255,255,0.08)` background, white text.
- **Active: `brand-primary` `#092C74` background + white text + a 3px
  `brand-light` left rail** (or, on a non-navy sidebar, `surface-tinted`
  background + `text-brand`). Only one item is active. There is no ambiguity
  about where you are.
- Items with children: chevron rotates 90° when open, `aria-expanded` set.
- Icons 20px, 2px stroke, consistent set. Icon + label on one baseline; icons
  never alone when there is room for a label.
- Footer: current user avatar + name + role, with a logout item. Keep the user
  block visible or pinned — do not let it scroll out of reach.
- Collapsed rail must keep tooltips on every icon.

---

## 3. Topbar

- Height 64px, white, `border-bottom: 1px solid var(--wk-color-border)`.
- Contents, in order: hamburger (mobile only) · global search · spacer ·
  notifications (with count badge) · help · user menu.
- Breadcrumbs go **below** the topbar, not inside it. Two distinct navigation
  levels, two distinct rows.
- Search: 320px max, radius 6, placeholder `text-muted` "Personel, departman
  ara…".
- Notification badge: `--wk-color-danger` dot with white count, `radius-full`,
  min 16px. **Never** brand blue for a notification count.
- Sticky on scroll; gains `--wk-shadow-subtle` when scrolled > 8px.

---

## 4. Page header

Consistent structure on every page:

```
BREADCRUMB   Personel / Departmanlar / Üretim
────────────────────────────────────────────────────────
H1  Üretim Departmanı            [Dışa Aktar] [ + Personel Ekle ]
    84 personel · 3 aktif ilan
```

- `h1` 24/32 700 `text-primary`, plus an optional accent word in `text-brand`.
- Meta line 14/20 `text-muted` — count, filter summary, last refresh.
- Actions right-aligned on the same baseline, primary last (rightmost).
- On mobile: `h1` full width, actions below as a full-width primary + icon
  secondary.
- Page header is **not** a card and gets **no** background fill. It is
  transparent, sitting directly on the canvas.

---

## 5. Content container

```css
.content {
  max-width: 1440px;
  margin-inline: auto;
  padding: 24px 32px;      /* desktop */
  padding: 16px 20px;      /* tablet  */
  padding: 12px 16px;      /* mobile  */
}
```

- Form-first screens (create/edit/detail) cap at **720px**. A 1440px form has
  a 2000px journey from first field to submit button.
- Table/dashboard screens may go full-bleed to 1600px inside an
  `overflow-x: auto` wrapper.

---

## 6. Grid

12-column, 16px gutter, 24px on mobile.

```css
.grid { display:grid; grid-template-columns:repeat(12,1fr); gap:16px; }
```

| Pattern | Columns |
| --- | --- |
| KPI / stat row | 4 × 3 (desktop) → 2 × 6 (tablet) → 1 (mobile) |
| Master–detail | 8 + 4 |
| Form + aside help | 8 + 4 → 12 |
| Content + sidebar | 9 + 3 → 12 |
| Table full width | 12 |

- Use CSS Grid `auto-fit`/`minmax` for KPI rows so they reflow without
  breakpoint-specific column counts.
- **Cards in a grid must align to the same height** (`align-items: stretch`).
  Ragged card bottoms are the clearest "assembled by hand" signal.
- Gaps are always a spacing token. Never `13px`.

---

## 7. Cards — and when not to use them

**A card is for a bounded, self-contained group of content that has a title
and would be meaningless outside its container.**

Use a card for: a KPI metric, a self-contained summary panel, a record
summary, a settings section, a dialog body.

**Do not use a card for:**

- A page section that is just a heading + content
- Every paragraph
- A single form field
- A table (tables have their own container semantics)
- Nested content (card inside card) — flatten it
- Purely decorative grouping that has no boundary meaning

> **The box-everything reflex is the primary cause of the "generic AI
> dashboard" look.** A screen of 12 identical bordered boxes with a coloured
> icon in the top-left corner of each reads as generated. Prefer whitespace and
> alignment over borders.

Card anatomy:

```
┌─────────────────────────────────────┐
│  Card title              [action]   │  padding 20px, title h3
│                                     │
│  Card body — body-sm 13/18          │  padding 20px
│                                     │
├─────────────────────────────────────┤  optional footer, sunken bg
│  Footer content                     │
└─────────────────────────────────────┘
  border 1px #E2E8F0 · radius 12 · NO shadow at rest
```

- `background: var(--wk-color-surface)`
- `border: 1px solid var(--wk-color-border)`
- `border-radius: var(--wk-radius-xl)` (12)
- `box-shadow: none` at rest; `--wk-shadow-subtle` on hover **only if the
  whole card is clickable**
- Padding 20px (`--wk-space-5`); dense variants may use 16px
- **Header and body must not both be bordered.** A card is one border.

---

## 8. Detail pages

Personel detail is the reference case.

```
← Personel Listesi                              breadcrumb
────────────────────────────────────────────────────────
┌──────────────────────────┬─────────────────────┐
│  Avatar  Mehmet Yılmaz   │  Durum: Aktif       │
│  12345 · Üretim Müh.     │  Departman: Üretim  │
│  mehmet@wagner.com.tr    │  İşe giriş: 2019    │
│  [Düzenle] [Pasif]       │  Telefon: ...       │
├──────────────────────────┤  ─────────────────  │
│  KİŞİSEL BİLGİLER        │  SON HAREKETLER     │
│  TCKN      •••• •••• 42  │  12.03 İzin onayı   │
│  Doğum     1985-04-11    │  01.03 Vardiya değiş.│
├──────────────────────────┤                     │
│  İŞLETME BİLGİLERİ       │  [Tüm geçmiş →]    │
│  Pozisyon   Kaynakçı     │                     │
└──────────────────────────┴─────────────────────┘
```

- Two-column: main content 8, summary 4. Summary is **sticky** on desktop so
  key facts stay visible while scrolling.
- Facts use a label/value grid: label `text-muted` `text-body-sm` uppercase;
  value `text-primary` `text-body` 600. Labels 40% / values 60%.
- Sensitive data (TCKN) **masked by default** with a reveal action. Never render
  a full national ID by default.
- Section titles are `h3` 16/24 600 with a `border-bottom` — they organise the
  page without adding a card each.
- Destructive actions (pasifleştir, sil) at the **bottom**, visually separated,
  never adjacent to the primary action.

---

## 9. Dashboard

An information-hierarchy problem, not a decoration problem.

1. **Page header** — title + date range + export
2. **KPI row** — 3–4 metrics, `stat` cards: label (`text-body-sm`,
   `text-muted`, uppercase) → value (`h1`, `text-primary`,
   `tabular-nums`) → delta (`text-caption`, semantic colour **and** an
   `▲`/`▼` glyph — never colour alone)
3. **Primary content** — the chart or table that answers the page's actual
   question. Give it the most space.
4. **Secondary** — breakdown list, recent activity
5. **Tertiary** — reference/quick links

Rules:

- **One primary chart.** Additional charts are secondary — smaller, muted, no
  competing accent.
- Charts use `--wk-chart-1..6`; gridlines `--wk-color-border`; axis labels
  `text-muted` 12px.
- **No gauges, no 3-D anything, no donut charts.** Bars and lines only.
- Every chart has a title stating the insight, not the metric:
  "Aylık personel artışı" — not "Personel Grafiği".
- If a chart needs a legend, cap at 6 series.
- Date filters are a single compact control, not three separate dropdowns.
- Whitespace between sections (32px) matters more than any border.

---

## 10. Overlays

| Overlay | Use when | Notes |
| --- | --- | --- |
| **Modal** | short, focused, blocking task | create/edit, confirm delete, small form |
| **Drawer** | a record's detail, or a long form needing context | right side, 480px; keeps the list visible |
| **Dropdown** | a short list of options | row actions, user menu, column menu |
| **Popover** | contextual help on a specific control | click-triggered, dismiss on outside click |

- Modal: `radius 12`, `shadow-elevated`, scrim `rgba(9,44,116,0.50)`. Title
  `h3` 16/24 600, body 14/20, footer right-aligned with the **primary on the
  right** (Turkish/LTR convention) and destructive on the left.
- Max width by purpose: confirm 400px · small form 480px · medium 640px ·
  large 960px. Never a full-viewport modal for a short task.
- Drawer width: 400–560px, full height, own scroll, `shadow-elevated`.
- **A modal is not a page.** If it needs scrolling *and* tabs *and* a sidebar,
  it should be a page.
- Every overlay: focus trapped on open, `Esc` closes, focus returns to the
  trigger on close, background scroll locked, `aria-modal="true"`,
  `role="dialog"` + `aria-labelledby`.

---

## 11. Toast

- Bottom-right (desktop) / full-width top (mobile). Above everything
  (`z-toast`).
- Auto-dismiss **5s** for success/info; **persist** for error and warning
  until dismissed — an error the user missed is an error that happened.
- `radius-lg` 8, `shadow-medium`, icon + message + optional single action
  ("Geri al") + close.
- Semantic: success → green, error → red, warning → amber, info → blue. Icon
  always present, never colour alone.
- Max 3 stacked. Fourth replaces the oldest.
- Never put the only copy of an error message in a toast that auto-dismisses.
- Always pair a destructive action with an **undo** toast where undo is
  possible — that removes the confirmation dialog entirely and is better UX.

---

## 12. Spacing rhythm between sections

| Gap | Value |
| --- | --- |
| Icon ↔ its label | 8 |
| Related controls (button group) | 8 |
| Field label ↔ input | 8 |
| Related form fields | 20 |
| Form sections | 24–32 |
| Content blocks | 32 |
| Major page sections | 40–48 |
| Table header ↔ first row | 12 |
| Table rows | 12–16 vertical, 16 horizontal |

When in doubt: **is the next element part of the same group?** If yes, use a
small step. If no, use 24–32. Proximity does the work — you rarely need a
divider.
