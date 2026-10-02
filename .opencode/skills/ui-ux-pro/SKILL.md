---
name: ui-ux-pro
description: Wagner Kablo corporate UI/UX design system for B2B web apps, admin panels, HR/personnel systems, dashboards, data tables, forms and responsive layouts. Use for ANY frontend or UI task in this project - building or editing pages, components, screens, layouts, styling, colors, typography, tables, forms, modals, or reviewing UI consistency. Enforces the navy/light-blue/grey brand palette, the Roboto type scale, verified WCAG contrast, and reuse of existing components. Triggers on - UI, frontend, page, screen, component, layout, style, CSS, Tailwind, dashboard, panel, form, table, modal, button, color, font, typography, spacing, responsive, a11y, accessibility, design system, "make it look good", "bu sayfayı yap", "arayüz", "tasarım".
metadata:
  brand: "Wagner Kablo A.Ş."
  domain: "personnel / HR management web application"
  token_prefix: "wk-"
  verified: "all color tokens checked against WCAG 2.1 contrast thresholds"
---

# ui-ux-pro — Wagner Kablo UI/UX Design System

You are building **production-ready B2B/corporate UI for Wagner Kablo A.Ş.**, a
Turkish automotive wire-harness manufacturer (est. 1992, Antalya Free Zone). The
users are HR staff, managers and back-office operators — not consumers. They use
this software for hours a day. Optimize for **speed, legibility, trust and
consistency**, never for visual novelty.

This is a **system**, not a suggestion. A page that invents its own colors,
font sizes, radii or spacing is a defect.

---

## 1. Non-negotiable workflow

Run these steps in order. Do not skip step 1 — it is the step that prevents
duplicate components and broken consistency.

1. **Inspect the existing UI first.** Find the components, tokens and theme that
   already exist in the repo. Read them before writing anything.
   - `package.json`, `tailwind.config.*`, `components.json`, `postcss.config.*`
   - `app/globals.css`, `src/index.css`, `styles/**`, any `theme.*` / `tokens.*`
   - `components/**`, `src/components/**`
2. **Detect the stack** and work inside it. Never swap frameworks, styling
   solutions, or add a UI library that is not already a dependency.
3. **Read the relevant reference file(s)** for this task. Load only what you
   need — see the routing table in §5. Do not bulk-read every reference.
4. **Reuse before you build.** If a component exists, use it. If one is close
   but wrong, extend it and keep the API stable. Only create a new component
   when nothing existing fits, and put it next to its siblings.
5. **Implement** using semantic tokens, never raw hex or magic numbers.
6. **Cover the four states** for every async surface: loading, empty, error,
   and populated. This is not optional.
7. **Verify** against the checklist in §6 before you call the task done.

---

## 2. Brand foundation (read this before any styling)

**The single brand color is `#092C74`** — a deep corporate navy.
It was recovered from Wagner Kablo's own production assets and is the source of
truth. It appears in their site header, their heading accent, their dropdown
accent, and their admin panel's `--iq-border-light`. It is already verified at
**12.93:1** against white (WCAG AAA).

```
#092C74  →  H 220°   S 86%   L 24.5%      ← brand-700, the anchor
```

Everything else is derived from that single hue so the system stays coherent.

**Distribution rule — this is the most important brand rule:**

> The interface is **neutral surfaces + controlled accent**. Brand blue is an
> *accent*, not a background fill. Brand colour accents the surface; it does
> not fill it. If a screen is more than roughly 15% brand blue, it is wrong.

| Use for | Token family |
| --- | --- |
| Primary actions, active nav, links, focus | **Navy / deep blue** `#092C74` → `#2E5CB8` |
| Selected states, subtle tints, info surfaces, highlights | **Light blue** `#C9D8F8` → `#E3EBFD` |
| Text hierarchy, borders, muted meta, disabled, dividers | **Cool grey** `#0F172A` → `#7D8A99` |
| Main background, cards, forms, tables, nav surfaces | **White / neutral** `#FFFFFF`, `#F8FAFC`, `#F1F5F9` |

**Semantic colors are NOT brand colors.** Never tint `success`/`warning`/`danger`
/`info` with brand blue, and never use brand blue to signal status. Meaning
wins over branding — if a color has to *mean* something, it must be the
semantic token, not the brand token.

Full palette, every token, every permitted/prohibited use and all measured
contrast ratios: **`references/colors.md`**.

---

## 3. Typography

**One family: Roboto**, weights 400 / 500 / 600 / 700. Variable font, one
download. Roboto is already in production in Wagner's own admin panel, is
Turkish-glyph-complete (`ı İ ğ Ğ ş Ş ç Ç ö Ö ü Ü`), has true tabular figures for
numeric tables, and stays legible at 12–13px where geometric fonts fail.

Poppins is Wagner's **marketing** font (it appears on the corporate site). It is
decorative-by-design and legally has no true italic. **Do not use Poppins in
product UI, tables, forms or dashboards.** Reserve it for marketing/brand
surfaces only. This separation is intentional — do not "unify" it.

Never introduce a second UI font. If a numeric or tabular view needs more, use
Roboto's `font-variant-numeric: tabular-nums`, not another family.

The nine-step scale (Display → Caption) with size/weight/line-height and usage:
**`references/typography.md`**. **Never hand-write a `font-size`.**

---

## 4. Spacing, radius, elevation

- **Spacing** — 4-based scale: `4 8 12 16 20 24 32 40 48 64 80`. Every gap,
  padding and margin is a step. No `13px`. No `7px`.
- **Radius** — a deliberately short list: `4 6 8 12 16` and `9999` (pills
  only). **Controls use 6.** Cards use 12. Introducing a 10th radius breaks the
  system.
- **Elevation** — exactly three steps: `subtle`, `medium`, `elevated`. Shadows
  are navy-tinted, never pure black. **Resting cards get no shadow at all** —
  they get a 1px border. Shadow means "this floats above the page" (dropdown,
  modal, toast, sticky header) and nothing else.

Details and the full token table: **`references/design-system.md`**.

---

## 5. Reference routing — read only what the task needs

All paths are relative to `references/`.

| Task | Read |
| --- | --- |
| Any styling/color/font decision | `colors.md`, `typography.md` |
| New page, dashboard, shell, navigation | `layout.md`, `responsive.md` |
| Buttons, inputs, badges, modals, tables… | `components.md` |
| Create/edit flows, validation, submit | `forms.md` |
| Lists, search/filter/sort/paginate, row actions | `tables.md` |
| Phone/tablet behavior, breakpoints | `responsive.md` |
| Usability, a11y, keyboard, feedback | `ux-rules.md` |
| "Why does this look off?" / final polish | `anti-patterns.md` |
| Brand rationale, tone, logo usage | `brand.md` |
| Tokens: spacing/radius/shadow/breakpoints | `design-system.md` |

Typical combinations: *new page* → `layout` + `components` + `colors`.
*Personel table* → `tables` + `components` + `responsive`.
*CRUD form* → `forms` + `components`. *Bug fix* → `anti-patterns`.

---

## 6. Definition of done

Before reporting a UI task complete, verify:

**Brand & color**
- [ ] Only semantic tokens used; no raw hex in components
- [ ] Brand blue is an accent, not a surface fill
- [ ] Semantic status colors used for status, brand blue for brand

**Typography**
- [ ] Single font family (Roboto); every size from the scale
- [ ] No all-caps paragraphs, no text below 12px, muted text still readable

**Layout & spacing**
- [ ] Spacing from the 4-based scale only; consistent alignment and rhythm
- [ ] Cards used only for real content grouping — not every element boxed

**States (the four)**
- [ ] Loading, empty, error and populated states all exist and are reachable
- [ ] Destructive actions confirmed and visually separated

**Components**
- [ ] Existing components reused; no duplicates created
- [ ] `hover / active / focus-visible / disabled / loading / error` handled

**Responsive**
- [ ] Checked at desktop, tablet and mobile widths
- [ ] Mobile re-thinks hierarchy — it is not desktop shrunk

**Accessibility**
- [ ] Text contrast ≥ 4.5:1, UI boundaries ≥ 3:1
- [ ] Visible focus ring on every interactive element
- [ ] Full keyboard operability; labels associated; semantic HTML

**Technical**
- [ ] No console errors, no runtime errors, no unnecessary new dependencies
- [ ] Existing architecture and conventions respected

---

## 7. Hard prohibitions

These produce an instant fail. Full catalogue in `references/anti-patterns.md`.

- Creating a **new visual language per page** — one system, one set of tokens
- Adding a **second font** or a second UI library without checking what exists
- **Neon, cyberpunk, gaming, or "futuristic"** aesthetics — actively wrong for
  an industrial manufacturer
- **Gradients everywhere**, heavy glassmorphism, glow/shadow abuse
- **Everything in a card**; **10 different radii**; **random spacing**
- **Generic AI-dashboard look** — the single biggest failure mode here
- Shipping UI with **no loading, empty or error state**
- **Icon-only buttons with no accessible name and no tooltip**
- **Destructive actions with no confirmation and no undo path**
- Removing `outline` without replacing it with a visible focus style
- Hardcoding colors instead of using tokens, or "just this once" hex values
