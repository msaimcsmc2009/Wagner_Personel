# responsive.md — responsive and device rules

## 1. Breakpoints

Mobile-first. Declare min-width queries in this order — one cascade, no
specificity fights.

| Token | Range | Columns | Gutter | Content padding |
| --- | --- | --- | --- | --- |
| `xs` | 0–479 | 4 | 12 | 12 / 16 |
| `sm` | 480–767 | 4 | 12 | 16 |
| `md` | 768–1023 | 8 | 16 | 20 |
| `lg` | 1024–1279 | 12 | 16 | 24 |
| `xl` | 1280–1439 | 12 | 24 | 32 |
| `2xl` | 1440+ | 12 | 24 | 32, container capped 1440 |

```css
/* mobile first */
.grid { grid-template-columns: repeat(4, 1fr); gap: 12px; }
@media (min-width: 768px)  { .grid { grid-template-columns: repeat(8, 1fr);  gap: 16px; } }
@media (min-width: 1024px) { .grid { grid-template-columns: repeat(12, 1fr); gap: 16px; } }
@media (min-width: 1280px) { .grid { gap: 24px; } }
```

**Do not use `max-width` queries.** They override in reverse source order and
cause exactly the bug you will waste an hour on: add a new `max-width` rule at
the bottom of the file and it silently wins over everything above it.

**No `width: 100vw`** for a full-bleed element — `100vw` includes the scrollbar
and produces a horizontal scroll. Use `width: 100%`, or `100dvw` where
supported.

## 2. Navigation per breakpoint

| Breakpoint | Navigation |
| --- | --- |
| `< 1024px` | Off-canvas drawer, 280px, `transform` slide, scrim `rgba(9,44,116,0.50)` |
| `1024–1279px` | 64px icon rail, tooltips on every item |
| `≥ 1280px` | 256px expanded sidebar |

- Hamburger lives in the topbar, leftmost, and is the **only** thing that opens
  the drawer. Do not duplicate it in the topbar and the page.
- The drawer closes on: navigation, scrim click, `Esc`, and any item ≥ 44px
  tall gets comfortable touch spacing.
- Sidebar state (expanded/collapsed) persists per user.
- Never hide navigation without providing an equivalent. A mobile build with no
  way to reach a module is a broken build.

## 3. The per-breakpoint contract

Every component has an explicit small-screen behaviour. There is no "it just
scales" and no "we'll fix it later".

| Component | < 768 | 768–1023 | ≥ 1024 |
| --- | --- | --- | --- |
| Sidebar | off-canvas drawer | 64px rail | 256px expanded |
| Table | card list | priority columns | full table |
| Data grid | 1 col | 2 col | 3–4 col |
| Page header | title, then actions below | title + actions | title + actions inline |
| Form | 1 col, full width | 1 col, capped | 1 col, max 720px |
| Filter bar | search full width, filters in a sheet | wrap to 2 rows | single row |
| KPI row | 1 col | 2 col | 4 col |
| Modal | full-screen (near 100% height) | 640px, max 90vh | 400–960px by purpose |
| Drawer | full-screen | full-screen or 480 | 400–560 right |
| Pagination | "« 1 / 10 »" + count | condensed | full with page numbers |
| Breadcrumb | last 2 items | last 3 | full |
| Tabs | horizontal scroll | scroll or fit | all visible |
| Toolbar | icon buttons, overflow in `⋯` | partial wrap | single row |
| Detail layout | single column, summary first | stacked | 8 + 4 with sticky summary |

**Detail-page order on mobile:** summary card, then the first section, then the
rest. The sticky-summary trick that works on desktop is meaningless on a phone.

## 4. Touch targets

- Minimum **44×44** (Apple HIG) / **48×48** (Material). Use 44px as the
  practical floor.
- Adjacent targets get **≥ 8px** separation so a mis-tap does not hit both.
- Checkboxes 18×18 need padding up to a 44×44 hit area — enlarge the
  `<label>`, not the visual box.
- Icon buttons: 40px desktop, **44px on touch**.
- No hover-only interaction anywhere. Every hover action has a tap equivalent.
- The primary action sits in the **bottom third** of a mobile viewport when it
  is the only action on the screen; sticky `position: sticky; bottom: 0` with
  `env(safe-area-inset-bottom)` padding.

## 5. Typography per breakpoint

Line length is the real constraint: **45–75 characters.**

| Token | < 768 | ≥ 768 |
| --- | --- | --- |
| `h1` | 24/32 700 | 32/40 700 |
| `h2` | 20/28 600 | 24/32 600 |
| `h3` | 18/26 600 | 20/28 600 |
| `h4` | 16/24 600 | 16/24 600 |
| `h5`, `h6` | 14/20 600 | 14/20 600 |
| `body-lg` | 16/24 400 | 16/24 400 |
| `body` | 14/20 400 | 14/20 400 |
| `body-sm` | 13/18 400 | 13/18 400 |
| `label` | 13/16 500 | 13/16 500 |
| `caption` | 12/16 400 | 12/16 400 |

- **Do not scale typography by viewport width.** No `vw` units, no
  `clamp()` on body text. Below ~360px and above ~1920px the two ends are
  unreadable. Step at breakpoints instead.
- Body text never below 14px; captions never below 12px.
- Mobile headings may be smaller than desktop headings — that is normal and
  fine. Body text should be the same size or one step larger.
- Long words (URLs, TCKN, project codes) need `overflow-wrap: anywhere` so they
  do not force a horizontal scroll.
- Turkish text grows ~15–20% over English when translated. Buttons, table
  headers and tabs need their width checked with real Turkish copy —
  "İzin Talebi Oluştur" is much wider than "Create Request".

## 6. Images and media

- `max-width: 100%; height: auto; display: block`. Always.
- `aspect-ratio` on every media container to reserve space and prevent layout
  shift. Logos: fixed `height` and `width: auto`.
- `loading="lazy"` on below-the-fold images; the hero/avatar above the fold is
  `loading="eager"` + `fetchpriority="high"`.
- Explicit `width`/`height` attributes to avoid CLS.
- Avatars: 40px in a list, 64px on a detail header. Never a 200px avatar in a
  table cell.
- SVG icons: `currentColor` and inherit size from the parent. One icon set,
  one stroke width (2px at 20px).
- Serve the logo as SVG where possible. Preserve the official aspect ratio and
  clear space — never restyle or recolour the Wagner logo.

## 7. Overflow

- `overflow-x: auto` on a **dedicated wrapper** around the table, with
  `-webkit-overflow-scrolling: touch` where needed. A sticky header needs
  `overflow: visible` on the header's own container, so the scroll wrapper must
  be the parent of the body, not an ancestor of the header.
- `min-width` on the table so columns cannot collapse below usability; the
  wrapper scrolls instead.
- `min-width: 0` on grid and flex children — without it, long content
  (a long name, a URL) blows out the track and creates page-level horizontal
  scroll. This is the single most common responsive bug.
- **No horizontal page scroll at 360px.** Verify at 360, 375, 414, 768, 1024,
  1280.
- Long strings: `overflow-wrap: anywhere`; identifiers: `tabular-nums` +
  truncation.

## 8. Orientation and device concerns

- Landscape phone: 320–480px height is the real constraint. Collapse the
  sidebar, keep the toolbar single-row, make the KPI row 2-up.
- Tablet: portrait ≈ a large phone (single column, drawer nav); landscape ≈ a
  small desktop. Do not build a separate tablet layout.
- Keyboard: a physical keyboard implies hover is not available, so any
  hover-only affordance must be surfaced. Also reserve space so the on-screen
  keyboard does not cover the focused field.
- Safe areas: `env(safe-area-inset-left/right/bottom)` for notched devices.
  Sticky footers and bottom-sheet buttons need it.
- Print: personnel lists and reports are printed. Provide a print stylesheet —
  hide nav, toolbars and actions; expand collapsed content; `color: #000` on
  white; repeat table headers on each page; show full URLs after links.

## 9. Verification

- Test at **360, 375, 414, 768, 1024, 1280, 1440** px.
- Test at 200% browser zoom — WCAG 1.4.4 requires no content loss.
- Test at **400% zoom / 320px effective width** — the page must reflow to a
  single column with no two-dimensional scrolling (WCAG 1.4.10).
- Verify with a keyboard only, and with a screen reader.
- Check every page for horizontal overflow at 360px.
- Verify Turkish strings at their real length in buttons, tabs and headers.
- Verify each component against the per-breakpoint contract above — if a
  component is not listed and not designed, that is a gap, not a default.
