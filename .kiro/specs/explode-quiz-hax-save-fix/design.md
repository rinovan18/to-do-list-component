# explode-quiz HAX Save Fix — Bugfix Design

## Overview

Komponen `<explode-quiz>` memiliki properti `questions` (Array) yang tidak pernah ditulis
ke atribut DOM karena tidak ada `reflect: true` dan tidak ada JSON converter pada deklarasi
propertinya. HAX editor menyerialize komponen ke HTML dengan membaca atribut DOM
(`element.getAttribute("questions")`), sehingga ketika nilai `questions` diubah melalui
HAX configure panel, perubahan itu tidak pernah masuk ke file HTML yang tersimpan. Setiap
reload halaman komponen kembali ke `DEFAULT_QUESTIONS`.

Perbaikan minimal yang diperlukan: tambahkan `reflect: true` beserta custom JSON
`converter` pada deklarasi properti `questions` di `static get properties()`, serta
perbaiki guard di `updated()` agar menangani `null` (karena `fromAttribute` kini bisa
mengembalikan `null` untuk atribut yang tidak valid).

---

## Glossary

- **Bug_Condition (C)**: Kondisi yang memicu bug — ketika `ExplodeQuiz` memiliki array
  `questions` yang ditetapkan tetapi `getAttribute("questions")` mengembalikan `null`,
  sehingga HAX tidak dapat menyerialize nilai tersebut
- **Property (P)**: Perilaku yang diinginkan setelah fix — `getAttribute("questions")`
  mengembalikan JSON string yang valid dan `JSON.parse` hasilnya deep-equals `el.questions`
- **Preservation**: Perilaku yang tidak boleh berubah — fallback ke `DEFAULT_QUESTIONS`,
  alur kuis normal, properti `scriptFunctionName`, editor internal, dan mode standalone
- **reflect**: Fitur LitElement yang secara otomatis menulis nilai properti ke atribut DOM
  setiap kali properti berubah; diaktifkan dengan `reflect: true` pada deklarasi properti
- **converter**: Objek `{ fromAttribute, toAttribute }` pada deklarasi properti LitElement
  yang mengontrol bagaimana nilai dikonversi antara tipe JavaScript dan string atribut DOM
- **HAX serialization**: Proses HAX editor membaca elemen DOM dan menulis representasi
  HTML-nya ke file, menggunakan `element.getAttribute(propName)` untuk setiap properti
- **DEFAULT_QUESTIONS**: Array tiga soal bawaan yang digunakan sebagai fallback di
  `elements/explode/explode-quiz.js` ketika tidak ada konfigurasi `questions` dari HAX
- **`_saveAll()`**: Method internal editor yang menetapkan `this.questions = [...]` dari
  `this._tempQuestions` setelah author selesai mengedit soal
- **`editable` / `editing`**: Properti Boolean yang sudah ada dan sudah menggunakan
  `reflect: true` — ini adalah contoh pola yang benar yang perlu diterapkan ke `questions`

---

## Component Architecture (Existing)

File: `elements/explode/explode-quiz.js`

Class: `ExplodeQuiz extends I18NMixin(DDDSuper(LitElement))`

Tag: `explode-quiz`

### Screens

Komponen menggunakan properti state `_screen` untuk menavigasi empat layar:

| `_screen` | Renderer | Deskripsi |
|---|---|---|
| `"name"` | `_renderNameScreen()` | Input nama siswa |
| `"question"` | `_renderQuestionScreen()` | Satu soal dengan 4 pilihan |
| `"result"` | `_renderResultScreen()` | Skor akhir |
| `"editor"` | `_renderEditorScreen()` | CRUD soal internal |

### Key Properties

| Properti | Tipe | reflect | Masalah |
|---|---|---|---|
| `questions` | `Array` | ❌ tidak | **Bug ini** — tidak pernah ditulis ke atribut |
| `scriptFunctionName` | `String` | ❌ tidak | Masih berfungsi karena HAX membaca string property secara berbeda |
| `editable` | `Boolean` | ✅ ya | Pola yang benar |
| `editing` | `Boolean` | ✅ ya | Pola yang benar |

### Editor Flow

```
_openEditor() / _openEditorFromName()
  → deep-copy questions ke _tempQuestions
  → _screen = "editor"

_saveAll()
  → this.questions = deep-copy of _tempQuestions  ← HARUS ter-reflect ke DOM setelah fix
  → _screen = _editorOrigin ("result" atau "name")

_cancelAll()
  → buang perubahan, kembali ke _editorOrigin
```

---

## Bug Details

### Bug Condition

Bug terpicu ketika `ExplodeQuiz` memiliki nilai `questions` yang ditetapkan (baik
melalui HAX panel maupun assignment JavaScript), tetapi nilai tersebut tidak ter-reflect ke
atribut DOM. HAX editor kemudian membaca atribut DOM yang kosong (`null`) dan menghasilkan
tag HTML tanpa atribut `questions`.

**Formal Specification:**

```
FUNCTION isBugCondition(X)
  INPUT: X of type ExplodeQuiz
  OUTPUT: boolean

  RETURN X.questions IS Array
    AND X.getAttribute("questions") = null
    AND "reflect" IS NOT true IN properties declaration of "questions"
END FUNCTION
```

**Root of the defect in source code** (`elements/explode/explode-quiz.js`, `static get properties()`):

```js
// BUGGY — attribute: true tanpa reflect: true dan tanpa converter
questions: { type: Array, attribute: true },
```

LitElement dengan `attribute: true` (tanpa `reflect: true`) hanya membaca atribut saat
komponen pertama kali di-parse dari HTML. Ia tidak pernah menulis nilai Array kembali ke
atribut DOM. Selain itu, tanpa custom `converter`, LitElement tidak tahu cara
men-serialize Array ke string.

### Secondary Issue: `updated()` Guard

Kode `updated()` yang ada saat ini:

```js
updated(changedProperties) {
  super.updated(changedProperties);
  if (this.questions && this.questions.length === 0) {
    this.questions = DEFAULT_QUESTIONS;
  }
}
```

Setelah fix diterapkan, `fromAttribute` bisa mengembalikan `null` ketika atribut berisi
JSON tidak valid. Guard saat ini tidak menangkap `null` (`this.questions && ...` hanya
memeriksa array kosong). Ini harus diperbaiki bersamaan dengan fix utama.

### Examples

| Skenario | `el.questions` | `getAttribute("questions")` | HAX output |
|---|---|---|---|
| Default (tanpa atribut) | `DEFAULT_QUESTIONS` (array) | `null` | `<explode-quiz>` — **benar**, tidak ada atribut yang diharapkan |
| HAX set custom questions | `[{...}, ...]` (array) | `null` ← **bug** | `<explode-quiz>` tanpa atribut → reload kehilangan data |
| Setelah fix — HAX set questions | `[{...}, ...]` (array) | `'[{"question":...}]'` | `<explode-quiz questions='[...]'>` — **benar** |
| Setelah fix — load dari atribut | parsed dari JSON string | JSON string | Data ter-restore dengan benar |
| Setelah fix — atribut JSON tidak valid | `DEFAULT_QUESTIONS` (fallback) | string tidak valid | Komponen fallback dengan benar |

---

## Expected Behavior

### Preservation Requirements

**Unchanged Behaviors:**

- Ketika komponen dirender **tanpa** atribut `questions`, `el.questions` harus tetap
  sama dengan `DEFAULT_QUESTIONS` (fallback tidak boleh rusak)
- Alur kuis normal (layar nama → soal → hasil) harus berjalan sama persis seperti sebelumnya
- Properti `scriptFunctionName` harus tetap tersimpan ke atribut dan ter-restore saat reload
  (ini sudah bekerja dan tidak boleh rusak)
- Editor internal (`_openEditor`, `_saveAll`) harus tetap memperbarui `el.questions` secara
  lokal seperti sebelumnya
- Semua penggunaan standalone/non-HAX harus tetap berfungsi normal
- Properti `editable` dan `editing` (yang sudah menggunakan `reflect: true`) tidak boleh
  terganggu

**Scope:**

Semua input yang **tidak** melibatkan assignment properti `questions` dari HAX sama sekali
tidak terpengaruh oleh fix ini. Ini mencakup:

- Mouse click pada tombol jawaban
- Navigasi layar (name → question → result → editor)
- Pengiriman hasil ke Google Sheets via `_submitToSheets`
- Touch inputs

---

## Hypothesized Root Cause

Berdasarkan analisis kode sumber (`explode-quiz.js`, `static get properties()`):

1. **Missing `reflect: true`**: Deklarasi properti `questions` saat ini adalah
   `{ type: Array, attribute: true }`. Tanpa `reflect: true`, LitElement tidak pernah
   memanggil `setAttribute("questions", ...)` ketika nilai properti berubah. HAX editor
   yang bergantung pada `getAttribute("questions")` selalu mendapatkan `null`.

2. **Missing JSON converter**: `type: Array` memberi tahu LitElement cara mem-parse
   atribut ke Array (via default `fromAttribute`), tetapi tidak otomatis menyediakan
   serializer untuk arah sebaliknya. Diperlukan `converter: { fromAttribute, toAttribute }`
   agar LitElement dapat menulis Array ke atribut sebagai JSON string dan membacanya kembali.

3. **`updated()` guard tidak menangani `null`**: Setelah converter ditambahkan,
   `fromAttribute` bisa mengembalikan `null` untuk JSON tidak valid. Guard eksisting
   `if (this.questions && this.questions.length === 0)` tidak menangkap `null` karena
   `null && ...` = `false` — maka perlu diperbarui ke `if (!this.questions || ...)`.

4. **Bukan masalah `attributeChangedCallback`**: LitElement sudah menangani ini lewat
   `type: Array` + `fromAttribute`. Masalahnya murni di arah reflect (property → attribute).

5. **`scriptFunctionName` tidak bermasalah** karena `type: String` — LitElement dapat
   stringify string secara native ke atribut tanpa converter khusus. Selain itu HAX
   menggunakan `inputMethod: "textfield"` yang membaca nilai property string secara langsung.

---

## Correctness Properties

### Property 1: Bug Condition — Questions Array Reflects to DOM Attribute

_For any_ `ExplodeQuiz` instance di mana array `questions` ditetapkan (baik melalui
JavaScript assignment maupun HAX configure panel), fungsi yang diperbaiki SHALL memastikan
`element.getAttribute("questions")` mengembalikan JSON string yang valid di mana
`JSON.parse(getAttribute("questions"))` deep-equals nilai `element.questions`.

**Validates: Requirements 2.1, 2.2**

### Property 2: Preservation — No-Attribute Fallback to DEFAULT_QUESTIONS

_For any_ `ExplodeQuiz` instance yang diinisialisasi **tanpa** atribut `questions`
(yaitu `isBugCondition` tidak berlaku karena tidak ada assignment kustom), fungsi yang
diperbaiki SHALL tetap menggunakan `DEFAULT_QUESTIONS` sebagai nilai `questions`, identik
dengan perilaku kode asli sebelum fix.

**Validates: Requirements 3.1, 3.5**

### Property 3: Round-trip Fidelity

_For any_ valid question array `Q`, `fromAttribute(toAttribute(Q))` SHALL deep-equal `Q`.
Ini menjamin data tidak rusak melewati siklus serialize → deserialize.

**Validates: Requirements 2.3, 2.4**

---

## Fix Implementation

### Changes Required

**File**: `elements/explode/explode-quiz.js`

**Total changes: 2 sections**

---

### Change 1 — `static get properties()`

**Specific Changes**: Ganti deklarasi `questions` dengan versi yang memiliki `reflect: true`
dan custom `converter`.

**Before (buggy):**
```js
questions: { type: Array, attribute: true },
```

**After (fixed):**
```js
questions: {
  type: Array,
  attribute: 'questions',
  reflect: true,
  converter: {
    fromAttribute: (value) => {
      if (!value) return null
      try { return JSON.parse(value) } catch { return null }
    },
    toAttribute: (value) => {
      if (!value) return null
      try { return JSON.stringify(value) } catch { return null }
    },
  },
},
```

**Rationale:**
- `reflect: true` mengaktifkan penulisan otomatis nilai ke atribut DOM setiap kali
  properti berubah, baik dari HAX panel maupun dari `_saveAll()`.
- `converter.toAttribute` mengubah Array menjadi JSON string saat ditulis ke atribut.
- `converter.fromAttribute` mem-parse JSON string kembali ke Array saat dibaca dari atribut.
- Guard `try/catch` + `if (!value) return null` memastikan JSON tidak valid tidak menyebabkan
  error runtime dan hasilnya adalah `null` yang tertangkap oleh guard di `updated()`.
- `attribute: 'questions'` (string eksplisit) untuk menghindari ambiguitas konversi nama.

---

### Change 2 — `updated()` method

**Specific Changes**: Tambahkan guard `null` agar fallback ke `DEFAULT_QUESTIONS` juga
bekerja ketika `fromAttribute` mengembalikan `null`.

**Before:**
```js
updated(changedProperties) {
  super.updated(changedProperties);
  if (this.questions && this.questions.length === 0) {
    this.questions = DEFAULT_QUESTIONS;
  }
}
```

**After:**
```js
updated(changedProperties) {
  super.updated(changedProperties);
  if (!this.questions || this.questions.length === 0) {
    this.questions = DEFAULT_QUESTIONS;
  }
}
```

**Rationale:**
- `!this.questions` menangkap kasus baru di mana `fromAttribute` mengembalikan `null`
  (atribut JSON tidak valid atau atribut kosong).
- `this.questions.length === 0` mempertahankan perilaku fallback untuk array kosong `[]`
  yang sudah ada sebelum fix.
- Perubahan ini idempotent — jika `questions` sudah terisi array valid, kondisi tetap
  `false` dan tidak ada efek samping.

---

### No Other Changes Required

- **`haxProperties`**: Tidak perlu diubah. Deklarasi configure panel sudah benar —
  `property: "questions"` dengan `inputMethod: "code-editor"` sudah ada. Setelah fix,
  HAX akan otomatis membaca atribut yang ter-reflect.
- **Logika kuis** (`_startQuiz`, `_selectAnswer`, `_advanceQuiz`, dll.): Tidak perlu
  diubah. Fix ini murni di lapisan properti LitElement.
- **Editor internal** (`_openEditor`, `_saveAll`, `_addQuestion`, dll.): Tidak perlu
  diubah. `_saveAll()` sudah melakukan `this.questions = [...]` yang setelah fix akan
  otomatis ter-reflect ke DOM.
- **Properti lain** (`scriptFunctionName`, `editable`, `editing`): Tidak terpengaruh.

---

## Testing Strategy

### Validation Approach

Strategi testing mengikuti dua fase:
1. Surfacing counterexample yang mendemonstrasikan bug pada kode yang **belum** diperbaiki
2. Memverifikasi bahwa fix bekerja benar dan perilaku yang ada tidak berubah

### Exploratory Bug Condition Checking

**Goal**: Konfirmasi root cause sebelum fix diimplementasikan.

**Test Cases** (dijalankan pada kode **UNFIXED** untuk mengobservasi kegagalan):

1. **Attribute Reflect Test** (akan gagal pada unfixed code):
   ```js
   el.questions = [{question: 'Q1', choices: ['A','B','C','D'], correctIndex: 0}]
   await el.updateComplete
   assert(el.getAttribute('questions') !== null)  // FAILS — returns null
   ```

2. **JSON Round-trip Test** (akan gagal pada unfixed code):
   ```js
   const q = [{question: 'Q', choices: ['A','B','C','D'], correctIndex: 1}]
   el.questions = q
   await el.updateComplete
   const attr = el.getAttribute('questions')
   assert(attr !== null)                         // FAILS on unfixed
   assert(JSON.parse(attr)).deep.equals(q)       // FAILS on unfixed
   ```

3. **HAX Serialization Simulation** (akan gagal pada unfixed code):
   ```js
   el.questions = customQuestions
   await el.updateComplete
   const serialized = el.getAttribute('questions')
   assert(serialized !== null)   // FAILS — HAX would write <explode-quiz> without attribute
   ```

4. **Restore from Attribute Test** (kemungkinan gagal pada unfixed code):
   ```js
   const el = await fixture(html`<explode-quiz questions='[{"question":"Q","choices":["A","B","C","D"],"correctIndex":0}]'></explode-quiz>`)
   assert(el.questions).deep.equals([{question:'Q', choices:['A','B','C','D'], correctIndex:0}])
   ```

**Expected Counterexample**: `getAttribute("questions")` mengembalikan `null` setelah
assignment programatik karena `reflect: true` tidak ada.

### Fix Checking

**Goal**: Verifikasi bahwa untuk semua input di mana bug condition berlaku, fungsi yang
diperbaiki menghasilkan perilaku yang diharapkan.

**Pseudocode:**

```
FOR ALL el WHERE isBugCondition(el) BEFORE FIX DO
  -- Apply fix (reflect: true + converter)
  result_attr := el_fixed.getAttribute("questions")
  ASSERT result_attr IS NOT null
  ASSERT JSON.parse(result_attr) deep-equals el_fixed.questions
END FOR
```

### Preservation Checking

**Goal**: Verifikasi bahwa untuk semua input di mana bug condition **tidak** berlaku,
fungsi yang diperbaiki menghasilkan hasil yang sama dengan fungsi asli.

**Pseudocode:**

```
FOR ALL el WHERE NOT isBugCondition(el) DO
  ASSERT F(el).questions  = DEFAULT_QUESTIONS
  ASSERT F'(el).questions = DEFAULT_QUESTIONS
  ASSERT F(el) = F'(el)   -- tidak ada perubahan perilaku
END FOR
```

### Unit Tests

- `getAttribute("questions")` mengembalikan JSON string yang valid setelah assignment
- `JSON.parse(getAttribute("questions"))` deep-equals array yang ditetapkan
- Inisialisasi dari atribut HTML: elemen yang dibuat dengan atribut `questions` harus
  mem-parse JSON dan menggunakannya sebagai `el.questions`
- Edge case: atribut `questions` berisi JSON tidak valid → fallback ke `DEFAULT_QUESTIONS`
- Edge case: atribut `questions` berisi array kosong `[]` → fallback ke `DEFAULT_QUESTIONS`
- `getAttribute("questions")` mengembalikan `null` ketika `questions` di-reset ke `null`
  (karena `toAttribute(null)` mengembalikan `null`)

### Property-Based Tests

- **Property 1 (Fix Check)**: Generate random valid question arrays
  (`fc.array(validQuestionArbitrary, {minLength: 1})`), assign ke `el.questions`, assert
  `getAttribute("questions")` non-null dan `JSON.parse` deep-equals input
- **Property 2 (Preservation)**: Generate arbitrary state untuk elemen tanpa atribut
  `questions`, assert `el.questions` deep-equals `DEFAULT_QUESTIONS`
- **Property 3 (Round-trip)**: Generate random question arrays, serialize via `toAttribute`,
  parse via `fromAttribute`, assert deep-equals original array

### Integration Tests

- Full HAX round-trip: simulate HAX saving `questions` attribute ke HTML string,
  parse HTML kembali ke elemen, verifikasi `el.questions` ter-restore dengan benar
- Switching antara default dan custom questions: set custom → `getAttribute` non-null;
  reset ke null → fallback ke `DEFAULT_QUESTIONS`
- Perubahan questions via `_saveAll()` juga ter-reflect ke atribut DOM setelah fix
  (karena `_saveAll` melakukan `this.questions = [...]`)
- Verifikasi `scriptFunctionName`, `editable`, `editing` tidak terganggu setelah fix
