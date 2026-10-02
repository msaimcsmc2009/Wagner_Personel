# components.md — production component rules

Every component here must handle: **default · hover · active · focus-visible ·
disabled · loading · error**. A component missing any of these is not finished.

## Global invariants

These hold for every component and are the fastest way to spot an inconsistency:

| Property | Value |
| --- | --- |
| Control radius | `6` (`--wk-radius-md`) |
| Overlay radius | `8` (`--wk-radius-lg`) |
| Container radius | `12` (`--wk-radius-xl`) |
| Control font | `text-body` 14/20 (inputs `text-body-lg` 16/24) |
| Control height | 40px standard · 32px small · 48px large |
| Border | `1px solid var(--wk-color-border-strong)` on controls |
| Focus | `2px solid var(--wk-color-focus-ring)`, `offset 2px`, `:focus-visible` |
| Transition | `120ms` (`--wk-duration-fast`) on colour/border/box-shadow |
| Motion easing | `cubic-bezier(0.4, 0, 0.2, 1)` |

**Reuse before you build.** Search the repo first. If a component exists, use
it. If it is close, extend it and keep its API stable. A new component goes next
to its siblings and must accept the same props as its peers.

---

## Button

Variants — exactly these five, no more:

| Variant | Background | Text | Border | Use |
| --- | --- | --- | --- | --- |
| `primary` | `brand-primary` `#092C74` | `#FFFFFF` | none | the one main action per view |
| `secondary` | `surface` `#FFFFFF` | `text-brand` | `border-strong` | supporting actions |
| `ghost` | transparent | `text-brand` | none | low-emphasis, toolbar |
| `danger` | `danger` `#DC2626` | `#FFFFFF` | none | delete, revoke, terminate |
| `link` | transparent | `link` `#2E5CB8` | none | inline navigation, low-commitment |

States:

```css
/* base */  height:40px; padding:0 16px; border-radius:6px;
           font:500 13px/16px; display:inline-flex;
           align-items:center; justify-content:center; gap:8px;
           white-space:nowrap; transition:all 120ms; cursor:pointer;

/* primary */
--primary            bg #092C74  color #FFF
--primary:hover      bg #0C2350                     /* 15.31:1 w/ white */
--primary:active     bg #0C1832                     /* 17.61:1 w/ white */
--primary:focus-visible  outline 2px #2E5CB8 offset 2px
--primary:disabled   bg #7D8A99  color #FFF  cursor:not-allowed  opacity:1
--primary:loading    same bg, spinner + "Kaydediliyor…", aria-busy=true, disabled

/* secondary */
--secondary          bg #FFF  color #092C74  border 1px #7D8A99
--secondary:hover    bg #F1F5F9
--secondary:active   bg #E2E8F0
--secondary:disabled bg #F1F5F9  color #7D8A99  border 1px #E2E8F0

/* danger */
--danger:hover       bg #B91C1C                     /* 6.47:1 w/ white */
--danger:active      bg #991B1B
```

Rules:

- **One `primary` per view.** If a page has two primary buttons, it has two
  pages' worth of intent — split it or demote one to `secondary`.
- `primary` sits **rightmost** in an action group (LTR); `danger` sits leftmost
  and is separated by a divider or a gap ≥ 24px.
- Never disable a button as the *only* feedback. Either explain why, or don't
  disable it.
- Loading must keep the button's width (swap label for spinner, do not collapse
  it) to avoid layout shift.
- Icon + label: icon 16px, `gap: 8px`. Icon 20px max inside a button.
- Sizes: `sm` 32px / padding `0 12px`; `md` 40px / `0 16px`; `lg` 48px / `0 20px`.
- `loading` label examples: "Kaydediliyor…", "Siliniyor…", "Yükleniyor…".

## Icon button

Square, `radius-full` (or `6` for a bordered square variant), icon 20px, no
text.

| Size | Box |
| --- | --- |
| sm | 32×32 |
| md | 40×40 |
| lg | 48×48 |

- **Must have an accessible name**: `aria-label="Personeli düzenle"`.
- **Must have a tooltip** on hover/focus, `radius-lg`, `shadow-medium`, appear
  after ~400ms, positioned below by default, and must not be the only place the
  action is described.
- **Never** a bare icon for a destructive action in a table row — use the
  `danger` ghost treatment *and* a tooltip, and put it in the row-action menu
  rather than as a lone red icon.
- `min 40×40` touch target on mobile (see `responsive.md`).

## Input / Textarea / Select

```
LABEL            (13/16 500, text-secondary, uppercase, 8px below)
┌──────────────────────────────┐
│ Değer                        │  height 40, padding 0 12px, font 16/24
└──────────────────────────────┘  border 1px #7D8A99, radius 6
HINT (13/18 text-muted)         (optional)
ERROR (13/18 danger-text)      (replaces hint; icon + text)
```

| State | Treatment |
| --- | --- |
| default | border `border-strong`, bg `surface`, text `text-primary` |
| hover | border `text-muted` (slightly stronger) |
| focus | border `brand-primary` + `outline 2px focus-ring offset 2px`; **never** `outline:none` |
| filled | unchanged from default — a value is not a state |
| error | border `danger`, + error text with a warning icon; `aria-invalid="true"` |
| success | border `success` **only** after explicit validation, never on every keystroke |
| disabled | bg `surface-disabled`, text `text-disabled`, `cursor:not-allowed` |
| readonly | bg `surface`, normal border, `cursor:text`, still focusable and copyable |

Rules:

- **Font is 16px, not 14px** on inputs — below 16px iOS/Safari zooms on focus.
- **A visible label is always present.** Placeholder is a *format example*, not
  a label. `placeholder="TCKN"` is fine; `placeholder="TCKN"` as the only label
  is not. Full rules in `forms.md`.
- Textarea: `min-height 96px`, `resize: vertical`, auto-grow optional.
- Select: native `<select>` for ≤ 10 options (it is fully accessible and
  keyboard-native on every device). Custom listbox only for search, multi-select
  or > 20 options — and then it must fully implement the ARIA pattern.
- Character counters appear **while typing near the limit**, right-aligned,
  `text-muted`, turning `warning` at 90% and `danger` at 100%.
- Never rely on placeholder colour alone to convey an error.

## Checkbox / Radio / Switch

- **Checkbox** 18×18, `radius-sm` 4, border `border-strong`. Checked: fill
  `brand-primary`, white checkmark. Indeterminate: fill + dash. Label right,
  `gap: 8px`, clickable as a whole (`<label>` wrapping both).
- **Radio** 18×18 circle, `radius-full`. Same colour logic. Use for 2–5 mutually
  exclusive options that should all be visible.
- **Switch** 40×22 track, `radius-full`, thumb 18px. Off: `border-strong` track.
  On: `brand-primary` track. **Only for immediate-effect settings** — never in a
  form that has a Save button. If the change needs saving, use a checkbox.
- Every one needs a real `<label>`; `aria-describedby` for its hint.
- Cards/radio-tiles: whole card is the target, selected state =
  `border-brand` 2px + `brand-primary-soft` background.

## Badge / Status pill

Two treatments, and only two:

| Type | Background | Text | Use |
| --- | --- | --- | --- |
| **soft** | `*-soft` | `*-text` | default in tables and lists |
| **solid** | `*` | `text-inverse` | high-emphasis, counts |

- Height 20–24px, `padding: 0 8px`, `radius-full`, `font: 500 12px/16px`.
- **Status is never colour alone.** Always include the status word
  ("Aktif", "Beklemede", "Pasif") and, where useful, an icon. A bare coloured
  dot is not accessible and does not scan.
- Semantic mapping: Aktif→success · Beklemede→warning · Pasif→danger ·
  Onay bekliyor→info · İzin→neutral/secondary.
- Count badges on nav items: `danger` background, white text — a pending count
  is an alert, not a brand highlight.

## Avatar

- Sizes 24 (inline), 32 (list), 40 (default), 64 (profile header).
- `radius-full`. Image with `object-fit: cover`.
- Initials fallback: 2 characters, `text-body` 500, background
  `brand-primary-soft`, text `text-brand`.
- Presence dot 10px, `radius-full`, semantic colour, bottom-right, 2px
  `surface` ring.
- Always have an accessible name (`alt`, or the person's full name adjacent).
- Do not invent faces. If no photo exists, initials — not a placeholder person
  icon repeated 248 times.

## Card

See `layout.md` §7. Restating the non-negotiables: `surface` background,
`1px border`, `radius 12`, **no shadow at rest**, padding 20, one border per
card (never a bordered header *and* a bordered body).

## Modal / Dialog

See `layout.md` §10. Component-level requirements:

```
┌─────────────────────────────────────┐
│ Başlık                        [ × ] │  padding 20, border-bottom
├─────────────────────────────────────┤
│ Gövde içeriği                       │  padding 20
│                                     │
├─────────────────────────────────────┤
│                   [İptal] [Kaydet]  │  padding 16 20, border-top
└─────────────────────────────────────┘  radius 12, shadow-elevated
```

- Widths: confirm 400 · small form 480 · medium 640 · large 960.
- `role="dialog"` `aria-modal="true"` `aria-labelledby` pointing at the title.
- Focus moves to the dialog (or the first field) on open, is **trapped** while
  open, returns to the trigger on close. `Esc` closes — except while a nested
  dropdown is open, where `Esc` closes only the dropdown.
- `body { overflow: hidden }` while open; restore on close.
- Title is an `h3`. Never use an `h1` inside a modal.
- Close button is an icon button with `aria-label="Kapat"` and a tooltip.
- Destructive confirm: danger button + `danger-soft` background + the subject
  named explicitly — "Ahmet Yılmaz kaydını silinecek. Bu işlem geri
  alınamaz." Never "Emin misiniz?"

## Dropdown / Menu

- `radius-lg` 8, `shadow-medium`, **no border**, `padding 4`, min width 200px.
- Opens on click. Closes on outside click, `Esc`, or selection. Returns focus to
  the trigger.
- Item height 36px, `padding 0 12px`, `gap 8px` for icon + label, `radius-sm`
  4. Hover `surface-sunken`. Disabled `text-disabled`.
- `role="menu"` with `role="menuitem"` **only** for action menus. For a list of
  navigation links, use a plain list — do not fake menu semantics.
- Destructive items are `danger-text` and separated by a `border` divider.
- Max ~8 items; beyond that, use a submenu or move the action to a page.
- Never nest more than one level deep.

## Tooltip

- Trigger: hover **or** focus, ~400ms delay, 600ms max open.
- `radius-lg` 8, `shadow-medium`, `padding 4 8px`, `text-caption` 12/16.
- Background `brand-dark` `#0C1832`, text `#FFFFFF` (17.61:1 ✅).
- Content: a **label**, not an explanation. Explain in help text, not tooltips.
- `aria-describedby` on the trigger. `Esc` dismisses.
- **Never put essential information only in a tooltip** — not on touch, not for
  keyboard-only users, not for screen readers.
- Never on a disabled element (no hover events) — wrap it or use help text.

## Tabs

- `nav > ul > li > button` with `role="tab"` / `aria-selected` /
  `aria-controls`; panels with `role="tabpanel"`.
- Height 40–44px, bottom border `1px border`, **no** full box around the tab.
- Active: `text-brand` 600 + `2px solid brand-primary` bottom indicator. Inactive:
  `text-secondary` 400. Hover: `text-brand`.
- Arrow-key navigation; `Home`/`End` jump; only the active tab is in the tab
  order (`tabindex="-1"` on the rest).
- **If the tab changes the URL, use real links** (`<a>`), not buttons.
- Max 6 visible tabs; beyond that use a sidebar or a select.

## Breadcrumb

- `nav > ol`, `aria-label="Breadcrumb"`, separators as CSS `::after` (not text,
  so screen readers do not announce them).
- Structure: `Ana Sayfa / Personel / Departmanlar / Üretim`
- Links: `text-muted`; hover `text-brand`; current page `text-secondary`, **not
  a link**, `aria-current="page"`.
- 13/18, separator `rgba(0,0,0,0.25)`, gap 8.
- Truncate from the left on overflow (keep `Ana Sayfa` and the current page
  visible), with the full path in a tooltip.
- Max 4 levels; deeper paths get a `…` collapse.

## Pagination

- Component: `nav` with `aria-label="Sayfalama"`, current page
  `aria-current="page"`.
- Page size default 25, options 10 / 25 / 50 / 100. Persist the choice.
- Buttons: `min 40×40`, `radius-sm` 4, `radius-full` on first/last only.
  Current: `brand-primary` bg, white text. Others: `text-secondary` on
  `surface`, `border-strong`.
- Show `1 … 4 5 6 … 24` — first, last, current ± 1, ellipses between.
- Always show the total: "1–25 / 248 kayıt".
- Result count and page size live in the **toolbar**, not the pagination.
- Changing page size resets to page 1. Changing filters resets to page 1.
- Server-side pagination for anything beyond a few hundred rows.

## Toast

See `layout.md` §11. Auto-dismiss 5s for success/info; **persist errors**
until dismissed. Icon + text always. Undo action where possible.

## Alert / Banner

Inline, contextual, in the flow. Distinct from a toast (persistent, not
transient).

| Type | Background | Text | Border-left | Icon |
| --- | --- | --- | --- | --- |
| success | `success-soft` | `success-text` | `success` 3px | check |
| warning | `warning-soft` | `warning-text` | `warning` 3px | alert-triangle |
| danger | `danger-soft` | `danger-text` | `danger` 3px | alert-circle |
| info | `info-soft` | `info-text` | `info` 3px | info |

- `padding 16`, `radius-lg` 8, `gap 12` (icon ↔ text), `role="alert"` for
  danger/warning, `role="status"` for success/info.
- Optional title (`h4` 14/20 600) + body (`text-body` 14/20).
- Dismissible alerts need an accessible close button. **Never auto-dismiss a
  danger alert.**
- A form-wide validation error at the top gets `role="alert"` + focus moved to
  it.

## Sidebar / Navbar

See `layout.md` §2 and §3.

## Table

Full specification in `tables.md`.

## Skeleton

- Mirrors the **real** content's geometry — same row height, same column
  widths, same element count. A skeleton that does not match the loaded layout
  causes a visible jump, which is worse than no skeleton.
- Blocks: `background: var(--wk-color-surface-sunken)`, `radius-sm` 4.
- Shimmer: a slow (1.2–1.6s) left-to-right gradient sweep at low opacity, or
  a 2s opacity pulse. `prefers-reduced-motion: reduce` → **static blocks, no
  animation**.
- Show 8–10 skeleton rows, not 3.
- Text lines: 60–100% of the real width, varied so it does not look like a
  barcode. Avatar placeholders 40×40 circles.
- **Never** show a skeleton for under ~300ms — it flashes and reads as a glitch.
  Delay the skeleton by ~200ms.
- Table skeleton keeps the header row visible and the table's height stable.

## Empty state

Not an afterthought — it is the state every new user sees first.

```
        ┌──────────┐
        │    ◌     │   icon 48px, text-muted
        └──────────┘

     Henüz personel kaydı yok

   Sisteme ilk personel kaydınızı ekleyerek
   başlayın. İçe aktarma ile toplu ekleme
   yapabilirsiniz.

   [ + Personel Ekle ]  [İçe Aktar]
```

- Centred, `padding 48` (`--wk-space-12`), `max-width 480px` for the text block.
- Icon 48px, `text-muted` — **not** a large brand-coloured illustration.
- Title `h3` 16/24 600 `text-primary`. Body `text-body` `text-muted`.
- **One primary action, plus one alternative at most.** If there is genuinely
  nothing to do, say so plainly instead of showing an empty button.
- **Every empty state must say which one it is** — there are four, and they need
  different copy and different actions:

| Empty type | Title pattern | Action |
| --- | --- | --- |
| first-use | "Henüz … yok" | create / import |
| no-results | "Sonuç bulunamadı" | **clear the filters** |
| filtered | "Bu filtreye uyan kayıt yok" | show the active filter chips + clear |
| no-permission | "Bu kayıtlara erişiminiz yok" | request access / go back |

The filtered case must display the active filters, otherwise the user has no
idea why the table is empty.

## Loading state

- **Under 300ms** → show nothing. A spinner that flashes is worse than a brief
  pause.
- **300ms–1s** → inline spinner in the region being loaded.
- **Over 1s** → skeleton (tables, cards) or a determinate progress bar for
  multi-step work.
- **Over 10s** → a progress message and, if possible, a cancel/continue
  choice. Never leave the user staring at an indeterminate spinner.
- Buttons: spinner inside the button, label "Kaydediliyor…", `aria-busy="true"`,
  disabled.
- Full-page navigation: a thin `2px` progress bar at the top of the viewport
  (navy), not a full-screen spinner.
- `role="status"` + `aria-live="polite"` for status text; `aria-busy="true"` on
  the region. Never `aria-live="assertive"` on a loading message.

## Error state

An error the user cannot act on is a broken screen.

- **Inline, next to the cause.** Input errors at the field (see `forms.md`).
- **Region-level**: `danger-soft` alert with what failed, which record, and the
  next step.
- **Table-level**: keep the toolbar and filters, show the error inside the table
  body area, offer "Tekrar Dene".
- **Page-level**: a centred block — icon, `h2` "Bir şeyler ters gitti", the
  actual reason in plain Turkish, a "Tekrar Dene" primary, and the request id
  for the support team.
- **Never** show a raw stack trace, an HTTP status alone, or "Bilinmeyen hata"
  as the whole message.
- **Always offer a recovery path.** "Tekrar Dene" if retryable; otherwise say
  what to do instead.
- `role="alert"` for the message; move focus to it for blocking failures.
- Log the technical detail to the console; show the human detail to the user.
