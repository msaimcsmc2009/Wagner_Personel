# forms.md — form and CRUD UX

Applies to: person create/edit, department, leave request, training, settings,
and any create-update-delete flow.

## 1. The eight rules

These are the non-negotiables. Each maps to a real, common failure.

1. **A visible label is always present.** Placeholder is never the label.
2. **Validate on blur and on submit**, not on every keystroke.
3. **Errors sit next to the field they belong to**, and also summarised at the
   top on submit.
4. **Say what to do, not just what is wrong.**
5. **Prevent double submit.** Disable the button and show a spinner.
6. **Mark required fields explicitly**, and mark optional ones too.
7. **Group long forms into sections** with a visible purpose.
8. **Separate destructive actions** from everything else.

---

## 2. Labels and placeholders

**A label is a permanent name. A placeholder is a temporary format hint.**

```html
<!-- WRONG: no label at all -->
<input placeholder="TCKN" />

<!-- WRONG: placeholder used as label — vanishes on type, breaks autofill,
     fails WCAG 3.3.2 (Label or Instructions) -->
<input placeholder="11 haneli TCKN" />

<!-- RIGHT -->
<label for="tckn">TCKN <span aria-hidden="true">*</span></label>
<input id="tckn" name="tckn" placeholder="11 haneli, 11 rakam" />
<span class="hint">Nüfus cüzdanındaki gibi, aralık ve nokta olmadan.</span>
```

Why this matters beyond aesthetics:

- Placeholder text disappears on focus, so the user loses the field's name.
- Browsers and password managers key off `name`/`autocomplete`, not placeholder.
- Screen readers get inconsistent support; WCAG 3.3.2 requires a programmatic
  label.
- Low-contrast placeholders fail 1.4.3.

**Label style:** `text-label` 13/16 500 `text-secondary`, uppercase, 8px above
the control. Position: always above. Never a floating label — it moves the
target while the user clicks.

**Required marker:** a `*` after the label plus
`aria-required="true"`. Optionally also suffix "Zorunlu" or a right-aligned
"(isteğe bağlı)" on non-required fields. Marking only required fields makes
every asterisk meaningless; consider marking the **optional** ones instead —
in a 20-field form that is far less noise.

---

## 3. Validation timing

| Moment | What to validate | Feedback |
| --- | --- | --- |
| On blur | field-level: required, format, length | inline error or success |
| On change, after first error | re-validate that field | error clears **as soon as** it is fixed |
| On submit | **everything** | scroll to + focus the first invalid field |
| On input, if field already errored | that field only | live clearing, no new errors |

- **Never show an error before the user has finished interacting.** Marking
  "geçersiz" while someone is still typing their TCKN is hostile.
- **Never validate on every keystroke from the start.** It scolds.
- **Clear the error the moment the input becomes valid.** Leaving a resolved
  error on screen is the most common small bug in internal tools.
- Async uniqueness checks (e.g. "bu TCKN zaten kayıtlı") run on blur, debounced
  ~500ms, with `aria-live="polite"` for the result.

---

## 4. Error messages

**Write the fix, not the diagnosis.**

| Do not | Do |
| --- | --- |
| "Geçersiz değer" | "TCKN 11 haneli olmalıdır (şu an 9 hane)." |
| "Hatalı giriş" | "Şifre en az 8 karakter içermeli." |
| "Doğrulama hatası" | "İşe giriş tarihi, doğum tarihinden sonra olmalı." |
| "Sunucu hatası 500" | "Kayıt şu an yapılamıyor. 1 dakika sonra tekrar deneyin." |
| "Bir hata oluştu" | "E-posta adresi kayıtlı. Farklı bir adres deneyin." |

Anatomy: **icon + message**, `danger-text`, 13/18, `margin-top 8px`, directly
under the control. `aria-describedby` links input → error. Input gets
`aria-invalid="true"` and a `danger` border.

On submit with multiple errors, show a summary at the top of the form:

```
  ⚠  2 alan düzeltilmeli
     • TCKN 11 haneli olmalıdır
     • İşe giriş tarihi zorunludur
```

Each item is a link that focuses its field. Plus a `danger-soft` alert with
`role="alert"`. Then scroll to it and focus it.

---

## 5. Layout and grouping

- Container max-width **720px**. A 1440px form is a scanning nightmare.
- One column. Two columns only for genuinely paired short fields
  (name + surname, start date + end date).
- Fields per section: **4–7**. More than that and it becomes a wall.
- Vertical rhythm: fields 20px apart, sections 32px, section heading has 24px
  above.

Grouping pattern for a personnel form:

```
KİŞİSEL BİLGİLER
  Ad *              Soyad *
  TCKN *            Doğum tarihi *
  E-posta           Telefon

İŞLETME BİLGİLERİ
  Departman *       Pozisyon *
  İşe giriş *       Vardiya
  Yönetici          İş sözleşmesi tipi

YETKİLENDİRME
  ☑ Sistem yöneticisi     ☐ Bordro görüntüleyebilir
  ☐ Personel ekleyebilir  ☐ Raporlama erişimi
```

- Section heading: `h3` 16/24 600, uppercase 12/16 `text-muted`,
  `letter-spacing 0.04em`, with a `border-bottom`. Not a card — a card per
  section means a card-in-card-in-card.
- **No stepper for ≤ 10 fields.** A wizard adds clicks and hides context. Use a
  stepper only at ~15+ fields with distinct phases.
- Checkbox groups get a `fieldset` + `legend`. Radio groups likewise.
- Show a **completion indicator** for long forms ("8 / 14 alan dolduruldu"),
  or better: validate completeness per section and mark it.

---

## 6. Submit behaviour

```
  [Geri]  [İptal]              [  Kaydet  ]
   ▲                            ▲
   danger-outline               primary, rightmost
```

- **Primary is rightmost.** "İptal" is secondary, to its left.
- On submit: **immediately** disable the button, swap in a spinner, change the
  label to "Kaydediliyor…", set `aria-busy="true"`. Guard the handler so a
  double click or Enter keypress cannot fire twice.
- **Never clear the form while submitting.** The user loses everything if the
  request fails.
- Disable **only the submit button** during submission — not the whole form.
  Let the user keep reviewing.
- Success: toast ("Personel kaydı oluşturuldu") + navigate to the record, or
  back to the list. If the user might create several in a row, offer
  "Kaydet ve yeni ekle".
- On failure: keep all input, show the error at the relevant field or in a
  top-level `danger-soft` alert, re-enable the button. **Never silently
  discard what the user typed.**
- Warn about unsaved changes on navigation away: a `beforeunload` prompt for
  a dirty form, and a confirm dialog on in-app route change.
- On a successful edit of a sensitive field, show what changed.

---

## 7. Destructive actions

- Delete / terminate / revoke is **never** the primary button. It is a
  `danger` outline at the **bottom** of the form, in its own section, ≥ 24px
  away from Save.
- Section labelled "Tehlikeli İşlemler" with a `danger-soft` or plain
  bordered container.
- **Name the subject explicitly** in the confirm dialog:
  "**Ahmet Yılmaz** kaydını silmek istediğinize emin misiniz? Bu işlem geri
  alınamaz."
- Prefer the words **sil** over **kaldır**, so the consequence is unambiguous.
- List what happens to related data ("2 izin kaydı ve 1 dosya da silinecek").
- If the record has dependencies, prefer **soft delete / pasifleştir** and
  offer archiving instead.
- Require the user to **type the name** to confirm only for high-impact
  actions (bulk delete, termination, permission removal).
- **Offer undo.** For reversible deletes, skip the dialog and show a toast with
  "Geri al" for 5s. Better UX and a better safety net than a modal.
- For bulk selection, the bar must state exactly how many records the action
  will affect.

---

## 8. Help text

- Hint text **above** the field for format requirements (the user needs it
  before typing); **below** for supplementary explanation.
- `text-body-sm` 13/18 `text-muted`. Placeholder for short format hints only.
- Persistent hint: always visible. Transient: appears on focus, must persist
  while the field has content or an error.
- A `?` icon button opens a popover for anything longer than one line —
  with `aria-label` and a tooltip.
- Do not hide required information behind a tooltip.

---

## 9. Accessibility

- Every input has a `<label for>`. Placeholders and `aria-label` are not
  substitutes for a visible label.
- `autocomplete` on identity fields (`name`, `given-name`, `family-name`,
  `email`, `tel`, `bday`, `organization-title`, `new-password`) — free UX for
  a data-entry-heavy product.
- Logical DOM order = visual order. **No positive `tabindex`** anywhere.
- Grouped controls in `<fieldset>` + `<legend>`; custom radios need
  `role="radiogroup"`.
- Errors: `aria-invalid`, `aria-describedby`, summary `role="alert"`.
- Required: `aria-required="true"` (plus the visual marker).
- Async results: `aria-live="polite"` — never `assertive` for validation.
- Inputs are 16px so mobile Safari does not zoom.
- `inputmode` and `type` set correctly: `type="email"`, `type="tel"`,
  `inputmode="numeric"` for TCKN, `type="date"` for dates.
- Native date input for dates (keyboard + locale-aware). A hand-rolled date
  picker must at minimum support typing, arrows, `Esc` and `Enter`.

---

## 10. Pre-fill and edit mode

**Create** — empty, no defaults except today's date where sensible, focus the
first field.

**Edit** — pre-filled, submit says "Güncelle" not "Kaydet", and the form
announces edit mode ("Düzenleniyor: Ahmet Yılmaz") so the user knows they are
not creating a duplicate.

**View** — read-only with a clear "Düzenle" affordance. Do not render
disabled inputs for a detail view; render text. A screen full of greyed-out
fields is worse than plain text.

- Warn before leaving a dirty form.
- Never silently reset a form on navigation.
- After a successful save, return to the record (not the list) so the user can
  verify what was saved.

---

## 11. Checklist

- [ ] Every field has a visible, programmatic label
- [ ] Placeholders are format hints only
- [ ] Required fields marked; optional ones labelled "isteğe bağlı"
- [ ] Validation on blur + submit, not per keystroke
- [ ] Errors adjacent, specific, actionable, Turkish
- [ ] Errors clear the moment the field becomes valid
- [ ] Error summary on submit, focusable links to fields
- [ ] `aria-invalid` / `aria-describedby` / `role="alert"` wired
- [ ] Grouped into 4–7 field sections with headings
- [ ] Max-width 720px, one column
- [ ] Submit disabled + spinner + `aria-busy`; handler double-fire guarded
- [ ] Failure preserves all input
- [ ] Success feedback + correct navigation
- [ ] Dirty-form warning
- [ ] Destructive action separated, named in confirm, undo offered
- [ ] `autocomplete` on identity fields; inputs 16px
- [ ] Full keyboard operability, logical tab order
