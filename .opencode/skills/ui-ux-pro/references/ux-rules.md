# ux-rules.md — interaction rules that hold everywhere

Cross-cutting rules. When two documents disagree, this file wins.

---

## 1. Feedback

**Every user action produces a visible response within 100ms.** No silent
actions.

| Rule | Detail |
| --- | --- |
| Click → response | ≤ 100ms perceived. Anything slower needs a pressed/loading state |
| Long operation | immediate button spinner + label change ("Kaydediliyor…") |
| Success | toast + navigation to the result |
| Error | inline, adjacent to the cause, with a recovery action |
| Toggle / switch | instant — a switch is only correct when it saves nothing |

## 2. Loading thresholds

| Duration | Response |
| --- | --- |
| < 100ms | nothing — no spinner, no flash |
| 100–300ms | nothing, or a subtle opacity dip |
| 300ms–1s | inline spinner in the loading region |
| 1s–10s | skeleton matching real geometry |
| > 10s | progress message, percentage if known, cancel/continue |

A skeleton that appears for 80ms is a glitch. Delay it ~200ms.

## 3. Navigation

- **URL is the source of truth.** Filters, sort, page and page size belong in
  the query string so a view is shareable, bookmarkable and survives refresh.
- Back/forward work correctly. No `history.pushState` on a filter change — use
  `replaceState` so the back button returns to the previous *page*, not the
  previous *filter*.
- Preserve list state (filters, sort, page, scroll) when returning from a
  detail view.
- Breadcrumbs for depth ≥ 2. Never for single-level pages.
- A modified tab sets a dot on the in-app tab title + `beforeunload` warning.
- Deep-link every detail page (`/personel/:id`) so records can be shared and
  bookmarked.

## 4. Modals

| Rule | Detail |
| --- | --- |
| Trigger | explicit user action only — never on page load |
| One level | no modal inside a modal |
| Escape | `Esc` closes (closes an open dropdown first) |
| Focus | trapped on open, restored to trigger on close |
| Scrim | click closes, **except** for forms with unsaved input |
| Scroll | background locked |
| Scrolling | never let a modal body scroll without a visible boundary |
| Width | 400 confirm · 480 small form · 640 medium · 960 large |
| Semantics | `role="dialog"` `aria-modal="true"` `aria-labelledby` |
| Title | `h3`, specific and action-oriented |

## 5. Destructive action

1. Offer **undo** where technically possible — then no dialog is needed at all.
2. Otherwise confirm, and **name the subject**: "Ahmet Yılmaz kaydını sil".
3. State the consequence and whether it is reversible.
4. Destructive is never the primary button, never adjacent to it.
5. Bulk: state the exact count before the action runs.

## 6. Keyboard

- Every interactive element reachable by `Tab`, operable with `Enter`/`Space`.
- **No positive `tabindex`.** Ever.
- `Tab` order follows the DOM, which follows the visual order.
- `Esc` closes the topmost dismissible layer only.
- `:focus-visible` styling on everything — `outline: 2px solid #2E5CB8;
  offset: 2px`.
- Roving `tabindex` in toolbars, menus and tab lists; only the active item is
  tabbable.
- Visible shortcuts in help (`?`), never a bare letter shortcut that fires
  while the user is typing in a field.
- Focus order on open: first interactive element, or the dialog itself for
  confirmations.

## 7. Forms

See `forms.md`. Summary of the load-bearing rules:

- Visible `<label>` for every field; placeholder is a format hint.
- Validate on blur and submit, clear errors the instant a field becomes valid.
- Errors adjacent, specific, actionable, in Turkish.
- `autocomplete` on identity fields; inputs 16px so mobile Safari does not zoom.
- Disable only the submit button during submit; never clear the form on
  failure.
- Destructive actions separated at the bottom.

## 8. Copy

| Rule | Example |
| --- | --- |
| Sentence case for labels and buttons | "Personel ekle", not "PERSONEL EKLE" |
| Sentence case for body | "İzin talebiniz onaylandı." |
| Button = verb + object | "Kaydet", "Personeli sil", "Dışa aktar" |
| Say what happened | "Personel kaydı oluşturuldu." not "İşlem başarılı" |
| Say what to do | "Belgeyi seçmek için tıklayın." not "Gerekli" |
| No jargon | not "Kayıt flush edildi" |
| No blame | "Şifre eşleşmiyor", not "Yanlış şifre girdiniz" |
| Date format | `12.04.2019` (Turkish) |
| Numbers | `1.234` thousands, `12,50` decimal |
| Buttons | 1–3 words, uppercase avoided |
| Errors | what happened + why + how to fix |

- Always write Turkish copy with Turkish casing: `i`/`İ`, `ı`/`I`. "Izin"
  instead of "İzin" is a visible bug.
- No all-caps for readability. Uppercase is for small labels and table headers
  only, and even there sentence case is often better.
- No exclamation marks in system messages. They read as noise in an HR tool.

## 9. Microcopy for the states

| State | Turkish copy |
| --- | --- |
| Loading table | "Personel yükleniyor…" |
| Saving | "Kaydediliyor…" |
| Deleting | "Siliniyor…" |
| Success create | "Personel kaydı oluşturuldu." |
| Success delete | "Personel silindi." |
| Success update | "Değişiklikler kaydedildi." |
| No results (search) | "Aradığınız kayıt bulunamadı." |
| No results (filter) | "Bu filtrelere uyan kayıt bulunamadı." |
| Empty (first use) | "Henüz personel kaydı yok" + "İlk kaydınızı ekleyerek başlayın." |
| Offline | "İnternet bağlantısı yok. Değişiklikleriniz kaydedilmedi." |
| Permission | "Bu sayfaya erişim yetkiniz yok." |
| Generic error | "Beklenmeyen bir hata oluştu. Sayfayı yenilemeyi deneyin." |
| Required field | "Bu alan zorunludur." |
| Network retry | "Bağlantı kurulamadı. Tekrar denemek için tıklayın." |

## 10. Performance as a UX rule

| Metric | Target |
| --- | --- |
| LCP | < 2.5s |
| INP | < 200ms |
| CLS | < 0.1 |
| Interaction response | < 100ms |
| Table query | < 1s server-side, debounced search 300ms |

- Never block the UI on a request. Optimistic updates only for reversible,
  low-risk actions — never for create/delete of personnel records.
- Skeleton over spinner for content-shaped loading; spinner for actions.
- Lazy-load below-the-fold images and heavy chart libraries.

## 11. Accessibility baseline

Target **WCAG 2.1 AA** as the minimum, AAA where cheap.

| Area | Requirement |
| --- | --- |
| Contrast | 4.5:1 body, 3:1 large text (18.66px bold / 24px) and UI borders — see `colors.md` |
| Focus | visible, `:focus-visible`, 2px ring, never removed |
| Keyboard | 100% operable, no traps, logical order |
| Landmarks | `header`, `nav`, `main`, `aside`, `footer`; one `main` |
| Headings | `h1` once per page, no skipped levels |
| Labels | visible + programmatic on every control |
| ARIA | only where native semantics fall short |
| Images | `alt` describing content; empty `alt=""` for decorative |
| Status | `role="status"`/`aria-live="polite"` for async results |
| Zoom | 200% zoom without loss; 400% / 320px reflow |
| Motion | `prefers-reduced-motion: reduce` respected |
| Language | `<html lang="tr">` |

> **ARIA supplements HTML; it does not replace it.** A `<button>` with
> `role="button"` is a worse button. Wrong ARIA is worse than none. Reach for
> native elements first.

---

## Pre-flight checklist

Run before declaring any screen done.

- [ ] Design tokens used; no hardcoded colours, spacing, radii or font sizes
- [ ] Every interactive element has hover, active, focus-visible, disabled,
      loading and error states
- [ ] Every action gives feedback ≤ 100ms
- [ ] Every form field has a visible label; errors are specific and actionable
- [ ] Every list handles loading, empty (all variants), error and populated
- [ ] Contrast meets AA, verified with the values in `colors.md`
- [ ] Keyboard operability confirmed; focus order logical and visible
- [ ] Icons have labels; icons used alone have tooltips + `aria-label`
- [ ] Responsive behaviour defined for every breakpoint in `responsive.md`
- [ ] No horizontal overflow at 360px; 200%/400% zoom verified
- [ ] Filter/sort/page state in the URL; back button behaves
- [ ] Destructive actions confirmed, named, and separated
- [ ] `prefers-reduced-motion` respected
- [ ] Turkish copy reviewed for casing, date and number formats
- [ ] No dead states, no "coming soon" in production code