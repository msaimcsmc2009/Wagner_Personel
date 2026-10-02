# AGENTS.md — Wagner Kablo Personel

## What this project is

A personnel management system for **Wagner Kablo**. It holds employee records,
departments, positions, shifts, leave requests and training. It is an internal
B2B tool: used daily by HR staff, in a browser, on a desktop more often than a
phone.

That context drives every UI decision below. HR staff work in this for hours.
Density, keyboard speed and trustworthy data beat visual novelty every time.

## Implementation scope

This repository is now an **implemented application**, not a documentation-only
folder. Design work has been specified; the code for it is now built.

**In scope — create, modify and delete freely:**

```
frontend/     React + TypeScript + Vite + Tailwind v4
backend/      Node + TypeScript + Express + Supabase
scripts/      dev tooling and lifecycle helpers
package.json  workspaces, scripts, dependencies
*.config.*    tsconfig, vite.config and similar
.env.example  documented variables (never real .env)
README.md     setup and run instructions
```

**Still out of scope until asked:** real Supabase credentials, database table
migrations, deployment configuration, and any new dependency that is not
required by the task. Do not add a dependency to restyle something.

**What did not change:** this document, the `ui-ux-pro` skill and its
references are the binding design contract. Every rule below — tokens, contrast,
keyboard operability, Turkish copy, table density, destructive actions — applies
to code you write exactly as it applied to the specification.

The rules that used to say *stop and describe it* now read: *when a request
matches the refused list, name the refusal and its reason, then implement the
alternative instead of the refused pattern.* The refusal list itself is
unchanged. `outline: none`, colour-only signals, per-keystroke validation,
purple branding and Turkish casing errors are still refused in code, exactly as
they were refused in the specification.

## Load the skill before any UI work

For any task touching design, layout, components, colour, typography, forms,
tables, accessibility, microcopy or UX, load and follow the `ui-ux-pro` skill:

```
.opencode/skills/ui-ux-pro/SKILL.md
.opencode/skills/ui-ux-pro/references/
  brand.md          Wagner Kablo identity + brand evidence
  colors.md         semantic palette, WCAG values, CSS wiring
  typography.md     Roboto scale + Turkish copy rules
  design-system.md  spacing, radius, elevation, focus, motion, breakpoints
  layout.md         shell, page structure, cards, detail, dashboard, overlays
  components.md     every component's states and specs
  forms.md          labels, validation, submit, destructive actions
  tables.md         data table system
  responsive.md     breakpoints, touch targets, reflow
  ux-rules.md       cross-cutting interaction rules + pre-flight checklist
  anti-patterns.md  what to refuse, and why
```

Read the relevant reference file. Do not work from memory.

---

## Non-negotiable rules

### 1. Navy `#092C74`, not purple

Wagner Kablo's brand colour is navy `#092C74`. Verified in `wagner.com.tr`
CSS and in the admin panel.

The purple `#850AA3` and teal `#1ABC9C` currently in
`manage.wagner.com.tr/assets/css/variable.css` are **stock TemplateHTML
defaults, not Wagner colours.** Do not treat them as brand. Do not propagate
them.

UI accent is navy. Large surfaces are neutral. Brand colour accents the surface;
it does not fill it.

### 2. Roboto in the product UI

Roboto, as in the existing admin panel — legible and space-efficient in dense
Turkish tables. Poppins only on marketing surfaces. Inter is the AI default and
is not the brand evidence.

### 3. Tokens only, never hardcoded values

No raw hex, no magic pixel values in components. Spacing, radius, colour, type
and motion come from the scale in `design-system.md` / `colors.md`.

If a value is not a token, question whether it should exist.

### 4. Fix tokens, not components

A visual problem is almost always a variable problem. Override the variable.
Do not add a dependency, rewrite components, or refactor architecture to change
how something looks.

### 5. Contrast is verified, not assumed

Body 4.5:1. Large text and UI borders 3:1. Every pairing in `colors.md` was
computed. Use those verified values; re-verify if a value changes. Never trust
an eyeballed colour.

### 6. Keyboard operable, always

Every interactive element: hover, active, `:focus-visible`, disabled, loading
and error states. No positive `tabindex`. Focus visible: 2px `#2E5CB8` ring at
2px offset. `outline: none` without a replacement is a rejected deliverable.

### 7. Every list handles all states

Loading, empty (first-use, filtered, no-results, no-permission), error and
populated. A filtered-empty table **shows the active filter chips and a "Filtreleri
Temizle" action**. An error state keeps the toolbar.

### 8. Labels are visible, not placeholders

Visible `<label for>` on every field. Placeholder is a format hint. Validate on
blur and submit, not per keystroke. Errors are specific, actionable and
adjacent to their field.

### 9. Destructive actions are deliberate

Not the primary button. Separated at the bottom. The confirm dialog **names the
person**. Undo preferred where possible.

### 10. Turkish, correctly

`lang="tr"`. Turkish casing (`İzin`, `İşe giriş` — not `Izin`, `Ise giris`).
Dates `12.04.2019`. Numbers `1.234` / `12,50`. No English strings. Check button
and header widths against real Turkish copy — it is 15–20% wider than English.

### 11. 48px rows, 7–8 visible columns

Table rows are 48px, never inflated. Text left, numbers right with
`tabular-nums`. Truncate with an ellipsis, never wrap. On mobile, a card list —
not a squeezed table.

### 12. Mobile is designed, not inherited

Breakpoints mobile-first, `min-width` queries only. 44×44 touch targets. No
horizontal overflow at 360px. Every component has an explicit small-screen
behaviour.

---

## Design defaults at a glance

| | |
| --- | --- |
| Sidebar | 256px, `#0C1832` — the only large navy surface |
| Content background | `#F8FAFC` |
| Card | `#FFFFFF`, `1px #E2E8F0`, `radius 12`, **no shadow at rest** |
| Control radius | 6 |
| Input height | 40px, font **16px** (iOS zoom) |
| Row height | 48px |
| Focus | 2px `#2E5CB8`, offset 2px |
| Elevation | subtle / medium / elevated — nothing else |
| Motion | 120ms colour, 200ms transforms, 300ms overlays |
| Breakpoints | 480 / 768 / 1024 / 1280 / 1440 |
| Primary action | one per view, navy, rightmost |

---

## Refused by default

Purple SaaS branding · gradients on text · glow and glassmorphism · emoji as
interface icons · a coloured icon square on every card · box-everything ·
nested cards · skeletons that do not match the real content · skeletons under
300ms · modals for full pages · placeholder-as-label · per-keystroke validation ·
icon-only buttons without an accessible name · delete as a bare red icon ·
tooltips carrying essential information · fixed 1280px layouts · 96px table rows ·
gauges, donuts, 3-D charts · rainbow chart palettes · charts without a title or
units · lorem ipsum · "Emin misiniz?" · English UI strings · Turkish casing
errors · error messages naming HTTP codes · `outline: none` · colour as the only
signal · ARIA replacing native semantics · positive `tabindex` · motion without
`prefers-reduced-motion` · new dependencies to restyle · parallel design systems.

Full reasoning for each: `references/anti-patterns.md`.

When a request matches one of these, say which, why, and what the alternative
is. Then implement the alternative.

---

## Pre-flight, every screen

- [ ] Tokens used, nothing hardcoded
- [ ] All interaction states present
- [ ] Feedback ≤ 100ms
- [ ] Labels visible; errors specific and actionable
- [ ] Loading / empty / error / populated all handled
- [ ] Contrast meets AA
- [ ] Keyboard operable, focus visible
- [ ] Responsive defined per breakpoint
- [ ] No horizontal overflow at 360px
- [ ] Turkish copy and casing correct
- [ ] Destructive actions deliberate
- [ ] `prefers-reduced-motion` respected

## Working language

Respond in **Turkish**. UI copy is Turkish. Code identifiers and file names
stay in English.