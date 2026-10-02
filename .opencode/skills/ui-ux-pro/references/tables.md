# tables.md — data table system

The personnel table is the most-used screen in this product. It is the screen
that most often turns into a generic dashboard. It gets the strictest rules.

---

## 1. Anatomy

```
┌──────────────────────────────────────────────────────────────────────┐
│ TOOLBAR                                                              │
│ [🔍 Ara…]  [Departman ▾] [Durum ▾] [İşe giriş ▾]  [+ Filtre]  [⋯]  │
├──────────────────────────────────────────────────────────────────────┤
│ ◯ │ Personel          │ Departman │ Pozisyon │ Durum │ İşe giriş │ ⋯│  header
├───┼───────────────────┼───────────┼──────────┼───────┼───────────┼──┤
│ ◯ │ AY Yılmaz         │ Üretim    │ Mühendis │ Aktif │ 12.04.2019│ ⋯│
│ ◯ │ BK Demir          │ Kalite    │ Uzman    │ Aktif │ 03.09.2021│ ⋯│
│ ◯ │ CD Kaya           │ Üretim    │ Teknisyen│ Bekl. │ 22.01.2020│ ⋯│
│ ◯ │ DE Şahin          │ Finans    │ Müdür    │ Pasif │ 15.08.2017│ ⋯│
├───┴───────────────────┴───────────┴──────────┴───────┴───────────┴──┤
│ 1–25 / 248 kayıt                     [<] [<] 1 2 3 … 10 [>] [25 ▾]  │
└──────────────────────────────────────────────────────────────────────┘
```

Five regions, always in this order: **toolbar → header → body → footer.**
The sticky header sticks; the toolbar may stick below it. The footer does not.

---

## 2. Column specification

| Property | Value |
| --- | --- |
| Row height | **48px** (comfortable) · 40px (compact) · never above 56px |
| Cell padding | 12px 16px |
| Header height | 40px |
| Header background | `surface-sunken` `#F1F5F9` |
| Header text | `text-label` 13/16 500 `text-secondary`, uppercase |
| Body text | `text-body` 14/20 `text-primary` |
| Row divider | `1px solid border` `#E2E8F0` |
| Row hover | `surface` → `#F8FAFC` |
| Row selected | `surface-tinted` `#E8F0FB` + `2px brand-primary` left rail |
| Cell align | text left · numbers right · status left · actions centre/right |
| Horizontal padding | 16px outer, 12px between cells |

### Row height is not negotiable

48px is the floor for a comfortable target. **Never** inflate rows with padding
to "fill" the viewport, and never stack two lines of data in a cell to justify
96px rows. If a record needs more data, use a **detail drawer on row click** —
that is what it is for. A 96px row means 8 records per screen instead of 15,
and the user scrolls four times as often.

### Column rules

- **Maximum 7–8 visible columns.** Beyond that, hide the low-priority ones
  behind a column picker.
- **Left-align text, right-align numbers.** Never centre body text.
- **Numeric columns get `tabular-nums`** and consistent decimal places.
  Columns of mixed alignment are the fastest way to make data unreadable.
- **Truncate, do not wrap.** `text-overflow: ellipsis; white-space: nowrap`,
  `max-width: 240px`, with the full value in a `title` attribute. Wrapping
  breaks the row rhythm and destroys scannability.
- **Sortable columns** get a visible affordance: a 16px caret, `cursor:
  pointer`, `aria-sort` on the `<th>`. Never a sort hidden in a dropdown.
- **Primary column first, always.** The column that identifies the record
  (personel adı) is column 1 and stays column 1 across all pages and views.
- **Actions last, always.** Never in the middle.
- Column widths are explicit; they must not jump between pages. A resizable
  column implementation must persist widths.

---

## 3. Search, filter, sort

**Search**
- In the toolbar, leftmost, `min-width 240px`, expands to ~360px.
- `inputmode="search"`, clear (×) button once there is a value.
- Debounce 300ms. Search **name, surname, TCKN, employee no, email, title** —
  be explicit about what is searchable, in a tooltip or hint.
- On mobile, search becomes a full-width field above the filter trigger.

**Filter**
- Dropdowns for enumerations (departman, durum, vardiya, iş sözleşmesi tipi).
- Popover panel for multi-select; a popover for date range.
- Each active filter shows as a **removable chip** below the toolbar, or inside
  the filter button as a count badge.
- **"Filtreleri Temizle"** appears whenever any filter is active. Without it,
  users cannot work out why a table is empty.
- A "Kaydedilmiş görünümler" feature (saved views) is genuinely valuable for
  HR — "Aktif üretim personeli" as a one-click view. This is functionality, not
  decoration.

**Sort**
- Click the header to cycle asc → desc → none.
- `aria-sort="ascending" | "descending" | "none"` on the `<th>`.
- **Server-side sort** for anything beyond a few hundred rows. Never sort only
  the visible page — it produces obviously wrong results.
- Only one sort column at a time. Multi-sort is a power-user feature and needs
  visible feedback if you add it.

**State reset rule:** changing a filter or the page size **resets to page 1**.
Keeping page 7 after a filter change shows an empty table and reads as a bug.

---

## 4. Pagination

- Default 25 rows; options 10 / 25 / 50 / 100. Persist the user's choice
  (localStorage) — remembering preferences is a real UX win in a daily tool.
- Footer: result count on the left, pagination controls on the right.
- Page size selector sits in the toolbar (it is a display preference, not
  navigation).
- Server-side for > 500 rows. Above ~10 000, require a filter or a search —
  and say so instead of loading 10 000 rows.
- Preserve filters, sort and scroll position when returning from a detail page.

---

## 5. Row actions

**Default: 2 visible + "more" menu.**

```
[👁 Detay] [✏️ Düzenle] [⋯]
                          ├─ Pasifleştir
                          ├─ E-posta gönder
                          ├─ ─────────────
                          └─ 🗑 Sil          (danger-text)
```

- **View** and **Edit** as visible icon buttons with `aria-label` **and**
  tooltip. Detail can also be triggered by clicking the row.
- Anything beyond that goes in a `⋯` dropdown, capped at ~6 items with a
  divider before destructive entries.
- Destructive actions are **never** a bare red icon in the row. Put them in the
  `⋯` menu, styled `danger-text`, with a confirm dialog (see `forms.md` §7).
- **Bulk actions:** when rows are selected, a sticky bar replaces the footer:
  "3 personel seçildi · [Pasifleştir] [Dışa Aktar] [İptal]". The count must be
  exact. Never leave a bulk bar visible with no selection.
- A checkbox column with a header "select all" (tri-state: none / some / all,
  where "all" means "all matching the filter" and says so).

---

## 6. States — all four, all reachable

| State | What the user sees |
| --- | --- |
| **Loading** | 8–10 skeleton rows matching the real column widths and row height; header visible; toolbar visible |
| **Empty (first use)** | Centred empty state, create/import action |
| **Empty (filtered)** | "Bu filtreye uyan kayıt yok" + **the active filter chips** + "Filtreleri Temizle" |
| **Empty (no results)** | "Arama sonucu bulunamadı" + the search term + "Aramayı temizle" |
| **Error** | Table shell and toolbar preserved; error inside the body area; "Tekrar Dene" |
| **Populated** | — |

The filtered-empty case is the one everyone gets wrong. **Show the active
filters.** An empty table with no explanation makes users assume the data is
gone.

**No state may remove the toolbar.** If search and filters disappear on error,
the user cannot retry correctly.

---

## 7. Responsive behaviour

**Desktop (> 1024px)** — full table, all columns, sticky header, row actions
inline.

**Tablet (768–1023px)** — priority columns only. Secondary columns move into a
row-detail drawer, or become an expandable sub-row on click. Toolbar collapses
overflow into a "Filtreler" button with a count badge.

**Mobile (< 768px)** — **stop pretending a table works on a phone.** Switch to a
**card list**:

```
┌──────────────────────────────────┐
│ (MY)  Ahmet Yılmaz        [Aktif]│
│       Mühendis · Üretim          │
│       İşe giriş: 12.04.2019  [⋯] │
└──────────────────────────────────┘
```

- Avatar + primary name + status badge + one line of context + action menu.
- 1 per row, `padding 12–16`, `border-bottom`, no card shadow.
- Search above; filters in a bottom sheet or a dedicated screen.
- **Prioritise 2–3 fields per card.** Trying to fit 8 columns at 360px produces
  a horizontally-scrolling unreadable mess — worse than a list.
- Selecting rows for bulk action: long-press to enter selection mode, or a
  visible checkbox. Do not use tiny 18px checkboxes as the only target.
- `overflow-x: auto` is a **last resort**, not a strategy.

---

## 8. Accessibility

- Real `<table>` semantics with `<thead>`, `<tbody>`, `<th scope="col">`.
  Do not build a table out of `<div>`s — screen readers announce nothing useful.
- `<caption class="sr-only">` describing the table, e.g. "Personel listesi,
  248 kayıt".
- Sortable headers: `<th aria-sort="ascending">` and a real `<button>` inside
  the `<th>`.
- Row actions have accessible names: `aria-label="Ahmet Yılmaz kaydını düzenle"`
  — not `aria-label="Düzenle"`, which is meaningless out of context.
- `aria-selected` on selectable rows; `aria-current` on the current page.
- The selection count is a `role="status"` `aria-live="polite"` region.
- Focus must be visible on every interactive element, including row-action
  buttons and the header sort buttons.
- Full keyboard path: tab to search → filters → header sorts → pagination.
- `prefers-reduced-motion` respected for the sticky-header transition.
- Minimum 40×40px interactive targets (ideally 44×44 on touch).

---

## 9. Performance

- **Server-side** pagination, sort and filtering. Do not load 248 rows and
  filter in the browser — it will not survive 24 800.
- Virtualise (windowing) beyond ~200 rendered rows. With 25-row pages this is
  rarely needed, but know when it is.
- `sticky` header via CSS, not JS scroll handlers.
- Memoise row components; a stable `key` (record id) prevents re-render churn.
- Skeletons only above ~300ms, otherwise they flash and read as a glitch.
- Optimistic UI only for low-risk, easily reversible actions (status toggle).
  Never optimistic for create/delete in an HR system — a wrongly-optimistic
  personnel record is a data-integrity problem.

---

## 10. Checklist

- [ ] 48px rows, 12×16 cell padding, no over-inflated rows
- [ ] Toolbar → header → body → footer, always in that order
- [ ] Sticky header; primary column first; actions last
- [ ] Text left, numbers right with `tabular-nums`
- [ ] Truncation with ellipsis + `title`, never wrapping
- [ ] Search debounced 300ms, with a clear button
- [ ] Active filters shown as chips + "Filtreleri Temizle"
- [ ] Sort via header click with `aria-sort`, server-side
- [ ] Page size 10/25/50/100, default 25, persisted
- [ ] Filter/page-size change resets to page 1
- [ ] View + Edit visible; rest in `⋯`; delete never a bare red icon
- [ ] Exact selection count in the bulk bar
- [ ] Loading / empty-first / empty-filtered / error all implemented
- [ ] Filtered-empty shows the active filter chips
- [ ] Error state preserves the toolbar
- [ ] Card list on mobile, not a squashed table
- [ ] Real `<table>` semantics, `sr-only` caption, accessible action labels
- [ ] Server-side pagination/sort/filter; no optimistic create/delete
