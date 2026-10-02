# anti-patterns.md — what to refuse

The point of this file is not style preference. Each entry below has caused a
real usability failure in Wagner Kablo's own system, or appears in the existing
admin panel, or is the default output of AI-generated UI.

If a design or implementation matches one of these, say so and fix it rather
than shipping it.

---

## Visual

### 1. Purple, teal and gradient "SaaS" branding
**Why it is wrong:** Wagner Kablo's brand colour is navy `#092C74`, verified
from `wagner.com.tr` and the admin panel CSS. The `#850AA3` purple and
`#1ABC9C` teal in `manage.wagner.com.tr/assets/css/variable.css` are **stock
TemplateHTML defaults, not Wagner brand colours** — that is why the existing
panel looks like an unrelated product. Do not propagate them.
**Instead:** navy accent on neutral surfaces. See `colors.md`.

### 2. Box everything
Every paragraph, every form field, every table wrapped in its own bordered
card with padding. This is the single clearest "AI-generated dashboard"
signal.
**Instead:** whitespace and alignment create structure. Cards only for
genuinely bounded, self-contained content with a title.

### 3. Icon in a coloured rounded square, top-left of every card
```
┌────────────────┐   ┌────────────────┐   ┌────────────────┐
│ ┌──┐           │   │ ┌──┐           │   │ ┌──┐           │
│ │📊│           │   │ │👥│           │   │ │⚙ │           │
│ └──┘           │   │ └──┘           │   │ └──┘           │
│ Başlık         │   │ Başlık         │   │ Başlık         │
│ Alt metin      │   │ Alt metin      │   │ Alt metin      │
│ Alt metin      │   │ Alt metin      │   │ Alt metin      │
└────────────────┘   └────────────────┘   └────────────────┘
```
A 248-item list rendered as this is a wall of noise. The icon adds nothing —
the heading already names the section.
**Instead:** plain heading + content, or a left-aligned accent rule.

### 4. Gradient text on headings
Purple-to-blue gradients on `<h1>`. Zero informational value, hurts
legibility, breaks in dark mode, and does not exist anywhere in real corporate
identity systems.
**Instead:** `text-primary`, or one accent word in `text-brand`.

### 5. Glow, glassmorphism, neon shadows
`box-shadow: 0 0 40px rgba(...)` on cards and buttons. Cheap-looking,
unreadable, and invisible to the visual hierarchy the content needs.
**Instead:** three elevation levels, used only where they mean something.

### 6. Emoji as interface icons
📊 👥 ✅ ⚠️ 🚀 in a production personnel system. Inconsistent across platforms,
no controlled weight or size, wrong semantics, screen-reader noise.
**Instead:** one icon set (Lucide/Feather/Phosphor), 2px stroke, 20px, `currentColor`.

### 7. Inter, Poppins or system font everywhere
**Why it is wrong:** Wagner's own admin panel loads **Roboto**, and it is the
most legible option for dense Turkish data tables. Poppins has a large
x-height and wide letterforms that eat horizontal space — poor for tabular
data. Inter is a reasonable neutral default but is not the brand evidence, and
it is the LLM default.
**Instead:** Roboto in the product UI. Poppins only on marketing surfaces.

### 8. Uniform 12–16px radius on everything
Cards, buttons, inputs, badges, avatars and tooltips all with the same curve,
often to the point of being fully rounded. Flat.
**Instead:** radius encodes hierarchy — inputs 6, overlays 8, containers 12,
pills full.

### 9. Oversized everything
`h1` at 48px, body at 18px, cards with 40px padding, KPI values at 56px. This
is a marketing layout applied to a data tool.
**Instead:** `h1` 32/40 700, body 14/20. Density is a feature in an HR panel.

### 10. Three gradients, five shadows and no alignment
Decorative variety with no grid. Every element slightly different padding,
nothing on a baseline, no consistent gutter.
**Instead:** 8px spacing scale, one grid, alignment doing the work.

---

## Component

### 11. Skeleton that does not match the real content
Three generic bars where a nine-column table will appear. Causes a layout jump
that is worse than no loading state at all.
**Instead:** mirror the real geometry — column widths, row heights, element
count.

### 12. A skeleton for every load
Showing a skeleton for 80ms. It flashes, reads as a glitch, and adds
perceived latency to a page that was actually fast.
**Instead:** delay ~200ms; show nothing under 300ms.

### 13. Modal for everything
Delete confirmation, then edit form, then detail view, then a 12-field form
with tabs — all in modals.
**Why it is wrong:** no back button, no URL, no browser refresh, trapped
context, and a scrollbar inside a scrollbar.
**Instead:** detail → page, edit → page or drawer, delete → small confirm
dialog, short form → small dialog.

### 14. Placeholder as label
```html
<input placeholder="Ad Soyad" />          <!-- label disappears on type -->
<input placeholder="İsim" />              <!-- fails WCAG 3.3.2 -->
```
Breaks autofill, breaks screen readers, breaks on focus.
**Instead:** visible `<label for>` + `autocomplete` + a format hint.

### 15. Validation on every keystroke
An error appears while the user is still typing the 9th digit of an 11-digit
TCKN.
**Instead:** validate on blur and submit; clear the error as soon as the value
becomes valid.

### 16. Icon-only buttons with no accessible name
A column of unlabelled grey squares.
**Instead:** `aria-label` naming the record ("Ahmet Yılmaz kaydını düzenle") +
tooltip. And prefer putting rarely-used actions in a `⋯` menu.

### 17. Delete as a bare red icon in a row
One mis-tap destroys a personnel record, unrecoverably.
**Instead:** `⋯` menu → danger-text item → confirm dialog naming the person. Or
drop the dialog entirely and offer undo.

### 18. Tooltip carrying essential information
"Analyze" with a tooltip explaining what Analyze does. Tooltips do not exist on
touch, are unreliable for keyboard and screen-reader users, and cannot be
translated.
**Instead:** visible label or visible help text. Tooltips only for short
labels.

### 19. Nested cards
A card inside a card inside a section card, each with its own border, shadow
and 20px padding.
**Instead:** one container, `border-bottom` section dividers.

### 20. Disabled button as the only feedback
Greyed-out "Kaydet" with no explanation. The user cannot tell whether it is
broken, still validating, or genuinely forbidden.
**Instead:** keep it enabled and show the validation error, or add a tooltip
saying why.

---

## Layout

### 21. Fixed 1280px layout
Horizontal scroll on any laptop narrower than the mockup.
**Instead:** mobile-first, `max-width` container, verified at 360–1440px.

### 22. Table forced onto mobile
Eight columns at 360px with `overflow-x: auto`, requiring horizontal scrolling
to read a person's name.
**Instead:** card list on mobile, 2–3 prioritised fields.

### 23. 96px table rows
Padding inflated to fill the viewport. 8 rows per screen instead of 15.
**Instead:** 48px rows; use a detail drawer for the extra data.

### 24. Fixed headers and sidebars ignoring scroll containers
`position: sticky` on a header inside a container that also has
`overflow: hidden`. The header does not stick, or it sticks to the wrong
container.
**Instead:** the scroll wrapper is the *parent* of the body, not an ancestor of
the header.

### 25. Missing `min-width: 0` on flex/grid children
One long unbroken string blows out a grid track and creates page-level
horizontal scroll.
**Instead:** `min-width: 0` on children + `overflow-wrap: anywhere` on long
strings.

---

## Data visualisation

### 26. Gauges, donuts and 3-D anything
Pie charts of a 12-category distribution; speedometer gauges of "OKR progress".
They encode value poorly and cost a lot of pixels.
**Instead:** bars and lines, ranked horizontally. If parts of a whole matter,
use a single stacked bar or just a table.

### 27. A rainbow of colours on every series
Six saturated hues on a chart with no semantic meaning, or one colour per
category on a table of 12 rows.
**Instead:** one accent for the meaningful series, muted greys for the rest.
`--wk-chart-1..6` maximum.

### 28. Charts without a title, units or context
```
  ▁▂▃▅▆▇      ← what is this?
```
**Instead:** a title stating the insight ("Aylık personel artışı"), axis labels
with units, a legend under 6 series, and a source/date note.

### 29. Truncated axis starting at a non-zero, non-round value
A bar chart whose y-axis starts at 97, exaggerating small differences into
dramatic slopes.
**Instead:** bar charts must start at zero. Line charts may use a non-zero base
when labelled clearly.

---

## Content

### 30. Lorem ipsum in production
Also: "Veri burada görüntülenecektir", "Yakında", "Coming soon".
**Instead:** real Turkish copy, or an empty state that explains what will appear
and how to create it.

### 31. "Emin misiniz?" confirmation
Two destructive outcomes and no indication of what is being deleted.
**Instead:** "**Ahmet Yılmaz** kaydını silmek istediğinize emin misiniz? Bu
işlem geri alınamaz."

### 32. English UI strings in a Turkish product
"Save", "Delete", "Search", "Total", "Loading".
**Instead:** "Kaydet", "Sil", "Ara", "Toplam", "Yükleniyor…".

### 33. Turkish casing errors
"Izin", " personel", "TCKN giriniz", "Ise giris".
**Instead:** correct Turkish casing — `İzin`, `Personel`, `İşe giriş`. In an
internal tool used daily by Turkish staff, this is a visible quality signal.

### 34. Error messages that name the technology
"HTTP 500", "TypeError: undefined is not a function", "JSON parse error",
"Sunucu hatası".
**Instead:** what happened, why, and what to do. Keep the technical detail in
the console.

---

## Accessibility

### 35. `outline: none`
Removes the focus ring and makes the app unusable by keyboard. It is the most
common accessibility defect shipped in production code.
**Instead:** `:focus-visible` with a 2px ring at 2px offset, designed against
every surface colour.

### 36. Colour as the only signal
Green/red status pills with no text. Unreadable to ~8% of men and to anyone on a
washed-out screen.
**Instead:** colour + text + icon. For trends, colour + `▲`/`▼` glyph.

### 37. ARIA replacing semantics
`<div role="button" tabindex="0">` instead of `<button>`;
`<div role="table">` instead of `<table>`. Screen readers announce nothing
useful and keyboard behaviour breaks.
**Instead:** native elements. ARIA only where HTML genuinely falls short.

### 38. Positive `tabindex`
`tabindex="1"` creates a second, invisible tab order that desynchronises from
the visual order.
**Instead:** DOM order = tab order. Always.

### 39. Modal without focus management
Focus stays behind the dialog. `Esc` does nothing. Screen readers read the
wrong region.
**Instead:** move focus in, trap it, `Esc` closes, restore focus to the trigger.

### 40. Animation without `prefers-reduced-motion`
Full-screen motion for users who have asked the OS for less.
**Instead:**
```css
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    transition-duration: 0.01ms !important;
  }
}
```

---

## Architecture

### 41. Introducing a new dependency to restyle
Adding a UI kit, an animation library or a chart library to change how an
existing screen looks.
**Instead:** fix the tokens. The stock-template purple in the existing CSS is a
**variable problem, not a missing-library problem** — override the variables.
See `colors.md`.

### 42. Rewriting working code for a visual change
A diff that touches 40 files to adjust a colour.
**Instead:** change the token, not the components.

### 43. Hardcoded values instead of tokens
`#092C74` in 30 component files, `14px` where `text-body` exists, `8px` gaps
written by hand.
**Instead:** tokens only. One source of truth. If a value is not a token, it
probably should not exist.

### 44. A parallel "new design" system alongside the old one
A second set of components with different names, colours and conventions,
added next to the existing one.
**Instead:** migrate the existing components in place, keeping their APIs
stable. One system, evolved.

---

## Refusal template

When a request matches an anti-pattern, respond in this shape — brief,
specific, with the alternative:

> `<anti-pattern adı>` kullanmıyorum. `<tek cümlelik gerekçe — kontrast,
> ölçek, kaynak, erişilebilirlik ya da marka kanıtına bağlı>`. Yerine
> `<somut alternatif ve token değerleri>` kullanıyoruz. `<dosya veya bileşen>`
> içinde şu şekilde uygulanacak: `<kısa tarif>`.

Never ship an anti-pattern silently. These are the things that make an
interface feel careless, and in a tool used daily by HR staff, carelessness is
the thing they notice.