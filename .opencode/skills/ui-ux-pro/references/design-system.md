# design-system.md — spacing, radius, elevation, z-index, breakpoints

These are the non-colour tokens. Short by design: a long list of options is the
reason systems drift.

---

## 1. Spacing scale

A 4-based scale. Every padding, margin, gap and offset is one of these steps.

| Token | px | Typical use |
| --- | --- | --- |
| `--wk-space-1` | 4 | icon-to-label inside a button, badge padding-x |
| `--wk-space-2` | 8 | gap between related controls, tight stack |
| `--wk-space-3` | 12 | input padding-y (sm), gap in a button group |
| `--wk-space-4` | 16 | **default** — card padding, input padding-x, gutter |
| `--wk-space-5` | 20 | card padding (comfortable), field margin |
| `--wk-space-6` | 24 | form section gap, panel padding |
| `--wk-space-8` | 32 | between content blocks, page section gap |
| `--wk-space-10` | 40 | major section separation |
| `--wk-space-12` | 48 | page top/bottom padding (desktop) |
| `--wk-space-16` | 64 | large empty states |
| `--wk-space-20` | 80 | display / login vertical rhythm |

### Rules

- **Off-scale is a defect.** No `13px`, no `18px`, no `30px`, no `7px`. If a
  layout needs `18px`, use `16` or `20` and adjust the neighbours.
- **Default to 16.** Most spacing is 16. Reaching for a rare step should be a
  deliberate, visible choice.
- **Related items get less space than unrelated items.** Within a group use
  `8`; between groups use `16`–`24`. This is the entire principle of proximity
  — honour it.
- **Vertical rhythm beats arbitrary spacing.** A form's fields sit on a
  consistent 20px baseline rhythm; text blocks on a consistent 16/20/24 rhythm.
- Padding scales with breakpoint: `16` on desktop, `12–16` on tablet, `12–16`
  on mobile. Never below 12 — touch targets and comfort both suffer.
- Use `gap` in flex/grid instead of margin-based spacing — it prevents
  margin-collapse bugs and keeps rhythm consistent.

```css
:root {
  --wk-space-1:4px;   --wk-space-2:8px;   --wk-space-3:12px;
  --wk-space-4:16px;  --wk-space-5:20px;  --wk-space-6:24px;
  --wk-space-8:32px;  --wk-space-10:40px; --wk-space-12:48px;
  --wk-space-16:64px; --wk-space-20:80px;
}
```

---

## 2. Border radius

Five values and a pill. **This list is closed.** A sixth radius is a system
break, not a design decision.

| Token | px | Applied to |
| --- | --- | --- |
| `--wk-radius-sm` | 4 | checkbox, radio, small badge, table cell chip |
| `--wk-radius-md` | **6** | **the default** — inputs, selects, buttons, icon buttons |
| `--wk-radius-lg` | 8 | dropdown, popover, tooltip, alert, accordion |
| `--wk-radius-xl` | 12 | card, modal, drawer, panel |
| `--wk-radius-full` | 9999 | avatar, status dot, pill badge, **icon button** |

### Assignment rules (fix them now, so they never drift)

- **Controls → `md` (6).** Every input, select, textarea, button, icon button
  (except circular), switch, checkbox, radio.
- **Overlays → `lg` (8).** Dropdown, popover, tooltip, alert, toast.
- **Containers → `xl` (12).** Card, modal, drawer.
- **Circles only → `full`.** Avatar, status dot, pill.
- **Nested → one step down.** A button inside a card: button `6`, card `12`.
  Never the same radius nested inside itself.
- **Never `xl` on a control.** A 12px-radius input reads as a toy.
- **Never `full` on a card or modal.** Pills communicate "round by intent" —
  a card has no round intent.

Corner radius should also shrink at small breakpoints: an `xl` card on a phone
may become `lg` if the viewport is under 360px. It is one of the few
legitimate radius changes.

---

## 3. Elevation

Exactly three steps. **Shadows are navy-tinted, never pure black** — pure black
on a navy-accented system reads as dirt.

| Token | Value | Used by |
| --- | --- | --- |
| `--wk-shadow-none` | `none` | **resting cards, table cells, list rows, sections** |
| `--wk-shadow-subtle` | `0 1px 2px rgba(9,44,116,0.06)` | hovered card, sticky header when scrolled, secondary button hover |
| `--wk-shadow-medium` | `0 4px 12px rgba(9,44,116,0.10)` | dropdown, popover, tooltip, toast, drawer |
| `--wk-shadow-elevated` | `0 12px 32px rgba(9,44,116,0.16)` | modal, command palette, drag preview |

### The elevation law

> **Resting surfaces get a border. Floating surfaces get a shadow. Never both
> on a card, never a shadow on a flat section.**

- A card at rest: `1px solid var(--wk-color-border)`, radius 12, **no shadow**.
  A border defines a container far more crisply than a soft shadow, and a grid
  of shadowed cards looks like a generic dashboard template.
- A card on hover: `shadow-subtle` (and a 1px border in `border-strong`). The
  elevation change signals interactivity.
- A dropdown/modal/toast: shadow, **no border** (the shadow is the separator).
- Elevation is a *z-order* signal, not a decoration. If a shadow is not
  communicating "this is above the page", remove it.

Do not add a `0 2px 4px rgba(0,0,0,0.1)` special case anywhere. If you need a
different elevation, the answer is one of these three.

---

## 4. Focus

One focus treatment across the entire product.

```css
:focus-visible {
  outline: 2px solid var(--wk-color-focus-ring);  /* #2E5CB8 */
  outline-offset: 2px;
  border-radius: inherit;
}
```

- `focus-ring` = `#2E5CB8` → **6.29:1 on white, 5.74:1 on sunken** — comfortably
  above the 3:1 WCAG 1.4.11 floor on every surface.
- On a **navy** surface (navy button, sidebar) use
  `outline-color: var(--wk-color-text-inverse)` → 12.93:1.
- **Never** `outline: none` without a replacement. The corporate site's
  stylesheet contains `:active, :focus { outline: none !important; }` — do
  **not** carry that anti-pattern into product code.
- `outline-offset: 2px` keeps the ring off the control so both are visible.
- Use `:focus-visible`, not `:focus`, so a mouse click does not leave a ring on
  a button — but keyboard focus always shows one.
- Focus must be visible on: buttons, links, inputs, selects, textareas,
  checkboxes, radios, switches, tabs, menu items, table row actions,
  pagination, modals, accordions, tree items. Anything focusable.

---

## 5. Z-index

A fixed scale. `9999` is not a z-index, it is a symptom.

| Token | Value | Layer |
| --- | --- | --- |
| `--wk-z-base` | 0 | page content |
| `--wk-z-sticky` | 100 | sticky header, sticky table header, sticky column |
| `--wk-z-drawer` | 200 | sidebar overlay on mobile |
| `--wk-z-dropdown` | 300 | dropdown, popover, select menu, tooltip |
| `--wk-z-sticky-footer` | 400 | table bulk-action bar, form action bar |
| `--wk-z-modal` | 500 | modal, drawer, dialog |
| `--wk-z-toast` | 600 | toast / notification |
| `--wk-z-overlay` | 700 | modal scrim |

---

## 6. Breakpoints

```css
--wk-bp-sm: 640px;    /* large phone  */
--wk-bp-md: 768px;    /* tablet       */
--wk-bp-lg: 1024px;   /* small laptop */
--wk-bp-xl: 1280px;   /* desktop      */
--wk-bp-2xl:1536px;   /* large desktop*/
```

| Name | Range | Shell |
| --- | --- | --- |
| Mobile | `< 768` | topbar + hamburger; sidebar as overlay drawer |
| Tablet | `768–1023` | collapsible rail, or overlay drawer; 2-col grids |
| Desktop | `1024–1279` | full sidebar 256px; 3–4 col grids |
| Wide | `≥ 1280` | sidebar 256–280px; content max-width 1440px |

- **Desktop-first is not required, but a single fluid range between
  breakpoints is.** Avoid 7–9 breakpoints. Each one is a place the design can
  break.
- **Do not design at exactly a breakpoint width.** Test at `bp-1` and `bp+1`.
- Match the project's existing breakpoint values if it already has them —
  consistency inside the codebase beats matching this table.
- Sidebar: 256px expanded, 64px icon rail (desktop), 0 + overlay (mobile).
- Content max width: 1440px for tables/dashboards, 720px for form-first
  screens (a 1440px-wide single-column form is unusable).
- Full-bleed table containers are allowed to exceed the max width — a personnel
  table has a legitimate need for horizontal room. Wrap it in an
  `overflow-x: auto` container.

---

## 7. Motion

Restrained, functional, and consistent.

| Token | Value | Used for |
| --- | --- | --- |
| `--wk-duration-fast` | 120ms | hover, focus, colour change |
| `--wk-duration-base` | 180ms | dropdown open, tooltip, badge |
| `--wk-duration-slow` | 240ms | modal/drawer enter, collapse |
| `--wk-ease` | `cubic-bezier(0.4, 0, 0.2, 1)` | everything |

### Rules

- Animate `opacity` and `transform`. **Do not animate `width`, `height`,
  `top`, `left` or `margin`** — they cause layout thrash and jank.
- **120ms for state feedback, 180–240ms for entering/leaving surfaces.**
- `prefers-reduced-motion: reduce` → collapse all durations to ~0.01ms and
  disable transform-based entrances. This is required, not optional.
- No parallax, no scroll-jacking, no infinite ambient animation, no animated
  gradients, no motion for decoration.
- Skeleton shimmer is acceptable (it communicates loading, which is real
  information) but must be gentle and must stop.
- Never animate on `prefers-reduced-motion`; respect the setting.

---

## 8. Borders and dividers

| Token | Value | Use |
| --- | --- | --- |
| `--wk-border-width` | `1px` | the default, everywhere |
| `--wk-border-width-focus` | `2px` | focus ring only |
| `--wk-color-border` | `#E2E8F0` | decorative dividers, card outline, table row rule |
| `--wk-color-border-strong` | `#7D8A99` | control boundaries (WCAG 1.4.11) |
| `--wk-color-border-brand` | `#092C74` | active left-rail, selected indicator |

- One border width (1px) for the whole product. A 2px border is for focus
  rings and active indicators only.
- Do not use borders on both a card and its inner sections — pick one. A card
  with a border plus a bordered header plus a bordered body is a box-in-box-in-
  box, which is the #1 cause of the "generic dashboard" look.

---

## 9. Quick reference card

```
FONT      Roboto 400/500/600/700 · scale 12–32px · body 14/20
BRAND     #092C74 (12.93:1 w/ white)
TEXT      #0F172A 17.85 · #475569 7.58 · #5A6779 5.75 · #7D8A99 3.52
SURFACE   #F8FAFC bg · #FFFFFF card · #F1F5F9 sunken · #E8F0FB selected
BORDER    #E2E8F0 decorative · #7D8A99 controls
STATUS    #15803D ok · #B45309 warn · #DC2626 danger · #0369A1 info
SPACE     4 8 12 16 20 24 32 40 48 64 80
RADIUS    4 sm · 6 md(DEFAULT) · 8 lg · 12 xl · 9999 full
SHADOW    none(flat) · subtle · medium(floating) · elevated(modal)
FOCUS     2px solid #2E5CB8, offset 2px, :focus-visible
MOTION    120/180/240ms, cubic-bezier(.4,0,.2,1), respect reduced-motion
```
