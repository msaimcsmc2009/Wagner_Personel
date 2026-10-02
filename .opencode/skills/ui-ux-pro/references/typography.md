# typography.md — type system

## 1. Font family

### Roboto — the single UI family

```
--wk-font-sans: 'Roboto', -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif;
--wk-font-mono: 'Roboto Mono', ui-monospace, 'SF Mono', Menlo, Consolas, monospace;
```

**Why Roboto, and why it is not a preference but a decision:**

| Reason | Detail |
| --- | --- |
| Already in production | Wagner's own admin panel (`manage.wagner.com.tr`) loads `Roboto:100,300,400,500,700,900`. It is not a new dependency — it is the house font. |
| On the approved shortlist | Inter, Manrope, IBM Plex Sans, Roboto, Source Sans 3 — Roboto is one of the five, so no justification fight is needed. |
| Turkish-complete | `ı İ ğ Ğ ş Ş ç Ç ö Ö ü Ü` are first-class glyphs. Wagner Kablo is an Antalya manufacturer with Turkish as the primary language. |
| Small-size legibility | Open apertures, high x-height, unambiguous `1/l/I`. Stays readable at 12–13px, which is where a personnel table lives. |
| Tabular figures | True `tabular-nums` alignment so numeric columns line up digit-for-digit. Non-negotiable for salary, leave-day and count columns. |
| Neutral, technical | Designed for high-legibility screens and industrial/automotive HMI. Reads as engineering software, which is the correct register. |
| One variable file | 400/500/600/700 from a single request. |

### Poppins — marketing only, never product UI

Poppins *is* Wagner's corporate-site font (`wagner.com.tr` loads
`Poppins:300,400,600`). It is deliberately **excluded from product UI**:

- Geometric sans with very circular bowls — poor form differentiation in dense
  data
- No true italic; the corporate site's `font-style: italic` on Poppins is
  synthetically slanted, which renders poorly
- Wider, lower-density per character — costs horizontal space in tables
- Above all, it is the wrong register: friendly-geometric marketing, not
  industrial operations

**Allowed**: marketing pages, brand landing sections, the wordmark lockup.
**Not allowed**: dashboards, admin panels, tables, forms, settings, anything an
employee uses to do their job. This separation is intentional — do not
"unify" it into one family everywhere.

### Rules

- **One UI family. Ever.** Do not add a second UI font to solve a layout
  problem — fix the spacing.
- If a numeric column needs better alignment, use
  `font-variant-numeric: tabular-nums`. Do not switch families.
- No more than **one** display/marketing face project-wide.
- Do not load a webfont that is not used; do not add weights you do not use.

---

## 2. The scale

Nine steps. Every `font-size` in the product is one of these. If a design seems
to need a tenth step, it needs a different existing step.

| Token | Size / line-height | Weight | Tracking | Used for |
| --- | --- | --- | --- | --- |
| `--wk-text-display` | 32 / 40 | 700 | -0.02em | login screen title, empty-state hero only |
| `--wk-text-h1` | 24 / 32 | 700 | -0.015em | page title, primary page heading |
| `--wk-text-h2` | 20 / 28 | 600 | -0.01em | section heading, card group title |
| `--wk-text-h3` | 16 / 24 | 600 | 0 | subsection, modal title, panel header |
| `--wk-text-h4` | 14 / 20 | 600 | 0 | fieldset legend, small group header |
| `--wk-text-body-lg` | 16 / 24 | 400 | 0 | page intro, form inputs, prominent body |
| `--wk-text-body` | 14 / 20 | 400 | 0 | **default** — table cells, paragraphs, nav |
| `--wk-text-body-sm` | 13 / 18 | 400 | 0 | dense table, helper text, toolbar |
| `--wk-text-label` | 13 / 16 | 500 | 0.01em | form labels, button labels, column headers |
| `--wk-text-caption` | 12 / 16 | 400 | 0.02em | metadata, timestamps, footnotes, legal |

That is 10 tokens covering 9 semantic levels (`body-lg` and `body` are the same
role at two sizes).

### Mapping to CSS

```css
--wk-text-display:   700 2rem/2.5rem    var(--wk-font-sans);   /* 32/40 */
--wk-text-h1:        700 1.5rem/2rem    var(--wk-font-sans);   /* 24/32 */
--wk-text-h2:        600 1.25rem/1.75rem var(--wk-font-sans);  /* 20/28 */
--wk-text-h3:        600 1rem/1.5rem    var(--wk-font-sans);   /* 16/24 */
--wk-text-h4:        600 0.875rem/1.25rem var(--wk-font-sans); /* 14/20 */
--wk-text-body-lg:   400 1rem/1.5rem    var(--wk-font-sans);   /* 16/24 */
--wk-text-body:      400 0.875rem/1.25rem var(--wk-font-sans); /* 14/20 */
--wk-text-body-sm:   400 0.8125rem/1.125rem var(--wk-font-sans);/* 13/18 */
--wk-text-label:     500 0.8125rem/1rem var(--wk-font-sans);    /* 13/16 */
--wk-text-caption:   400 0.75rem/1rem   var(--wk-font-sans);   /* 12/16 */
```

Or as Tailwind `@theme` entries named `text-display`, `text-h1` … `text-caption`.

---

## 3. The absolute rules

These are the rules that get broken most often.

1. **Never write a literal `font-size`.** Use a scale token. `37px` on one page
   and `43px` on another is the single clearest sign a page was designed in
   isolation.
2. **Nothing below 12px.** `caption` at 12px is the floor. 10px and 11px exist
   only in chart axis tick labels, and even there 12px is preferred.
3. **Body text is 14px, not 16px.** 16px is for inputs and intros. A personnel
   table with 16px rows is unusable — the eye cannot track across.
4. **Line height is part of the token.** Never set `line-height` independently.
   Body 14/20, headings tighter (1.2–1.33), display 1.25.
5. **One heading level per page.** Exactly one `h1`. Descend without skipping
   (`h1 → h2 → h3`). Heading level is a semantic outline, not a size choice.
6. **Muted text is still text.** Use `text-muted` (`#5A6779`, 5.75:1). Never
   `#999`, `#AAA` or `#BBB` for anything a user must read.
7. **Uppercase is for short labels only** — buttons, badges, table headers,
   eyebrow labels. Never a paragraph, never a heading, never a table cell
   value. If a "label" needs a full sentence, it is not a label.
8. **Measure: 60–80 characters** per line for body text. For forms and tables
   narrower is fine; for prose cap the container.
9. **Numbers align.** Any column of numbers gets `font-variant-numeric:
   tabular-nums`, right-aligned, consistent decimal places.
10. **Don't rely on weight alone for hierarchy.** Size + weight + colour
    together. 600-weight 14px grey next to 400-weight 14px grey is too subtle
    to scan.

---

## 4. Hierarchy in practice

A Wagner Kablo page hierarchy, using the tokens:

```
h1            24/32  700  text-primary      "Personel Listesi"
p (subtitle)  14/20  400  text-muted        "Toplam 248 kayıt · 12 departman"
──────────────────────────────────────────────────────────
h2            20/28  600  text-primary      "Aktif Personel"
label         13/16  500  text-secondary    "DEPARTMAN"
value         14/20  600  text-primary      "Üretim"
meta          12/16  400  text-muted        "14.03.2026 09:42"
```

Note the pattern: **one `h1` per page, then `h2` per section, then a
label/value/meta triad inside.** Labels are the only place uppercase appears.

The brand accent appears in exactly one place per heading — optionally, on the
single word that matters:

```
h1  Personel <span>Listesi</span>      ← span is text-brand (#092C74)
```

This mirrors the corporate site's own heading treatment
(`h1..h6 > span { color: #092C74 }`), so the product stays visually continuous
with the brand. One accent word, never the whole heading.

---

## 5. Turkish typography notes

- Use proper Turkish casing: `İ` and `ı` for Turkish, not `I`/`i`.
  `text-transform: uppercase` on "i" yields `I` in many fonts — set
  `lang="tr"` on `<html>` and verify the dotless-ı path.
- Date format: `DD.MM.YYYY` (Turkish convention), e.g. `14.03.2026`.
- Decimal/thousand separator: `.` and `,` (`1.234,56 ₺`).
- Currency suffix: `₺` after the number, with a space.
- Names: preserve diacritics exactly as entered in the source system. Never
  transliterate `Ş` → `S` or `İ` → `I` in display, sorting or export.
- Sorting must be locale-aware (`localeCompare('tr')`), not ASCII — otherwise
  `Ç` and `Ş` land in the wrong place.
- Prefer `₺` over "TL" in new UI; use "TL" only in official/legal contexts.
