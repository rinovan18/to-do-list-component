# Implementation Plan: todo-list

## Overview

Implementasi komponen web `<todo-list>` dalam monorepo HAX Webcomponents menggunakan pure JavaScript, LitElement, `I18NMixin(DDDSuper(LitElement))`, dan DDD design tokens. Komponen di-scaffold terlebih dahulu lalu diimplementasikan secara inkremental: struktur & scaffolding → state & logika bisnis → rendering & tampilan → aksesibilitas & i18n → pengujian. Semua logika berada dalam satu file `elements/todo-list/todo-list.js`.

---

## Tasks

- [x] 1. Scaffold dan setup struktur komponen
  - Jalankan `hax webcomponent todo-list --writeHaxProperties --y` dari root monorepo
  - Verifikasi direktori `elements/todo-list/` terbuat dengan file `todo-list.js`, `demo/index.html`, `test/`, `package.json`, `.dddignore`
  - Buat/perbarui `.dddignore` dengan konten standar (exclude `/node_modules`, `/test`, `*.json`, dll.)
  - _Requirements: 1.5_

- [x] 2. Implementasi struktur kelas dan registrasi komponen
  - [x] 2.1 Tulis mixin chain dan registrasi custom element
    - Ubah kelas hasil scaffold agar extends `I18NMixin(DDDSuper(LitElement))`
    - Tambahkan `static get tag()` yang mengembalikan `'todo-list'`
    - Gunakan `globalThis.customElements.define(TodoList.tag, TodoList)` untuk registrasi
    - Tambahkan `static get haxProperties()` dengan field `canScale`, `canPosition`, `canEditSource`, `gizmo`, `settings`
    - _Requirements: 1.1, 1.2, 1.3, 1.4_

  - [x] 2.2 Definisikan reactive property `tasks` dan string i18n
    - Deklarasikan `tasks: { type: Array }` di `static get properties()`
    - Inisialisasi `this.tasks = []` di constructor
    - Definisikan `this.t` di constructor dengan semua key: `addTask`, `inputPlaceholder`, `deleteTask`, `emptyMessage`, `taskCompleted`, `taskIncomplete` beserta nilai default bahasa Inggris
    - _Requirements: 2.1, 2.4, 8.2, 8.4_

- [x] 3. Implementasi metode logika bisnis (tanpa rendering)
  - [x] 3.1 Implementasi `_addTask()` dengan validasi input dasar
    - Baca nilai `<input id="task-input">` dari shadowRoot
    - Trim nilai input; jika kosong atau hanya whitespace → return early tanpa perubahan
    - Buat task object: `{ id: crypto.randomUUID(), text, completed: false }`
    - Update `this.tasks = [...this.tasks, newTask]` (immutable)
    - Kosongkan nilai input dan kembalikan fokus ke input field
    - _Requirements: 2.4, 3.2, 3.3, 3.5_

  - [x] 3.2 Tulis property test untuk Property 1 (Task Object Schema Invariant)
    - **Property 1: Task Object Schema Invariant**
    - **Validates: Requirements 2.4, 3.2**
    - Gunakan `fc.string({ minLength: 1 }).filter(s => s.trim() !== '')` untuk generate teks valid
    - Verifikasi task yang dihasilkan punya `id` string non-empty, `text` sesuai input trim, `completed === false`

  - [x] 3.3 Tulis property test untuk Property 2 (Whitespace Input Rejection)
    - **Property 2: Whitespace Input Rejection**
    - **Validates: Requirements 3.5**
    - Gunakan `fc.stringOf(fc.constantFrom(' ', '\t', '\n'))` untuk generate whitespace string
    - Verifikasi `tasks.length` tidak berubah setelah mencoba menambah whitespace string

  - [x] 3.4 Tulis property test untuk Property 3 (Task Addition Increases List Length)
    - **Property 3: Task Addition Increases List Length**
    - **Validates: Requirements 3.2, 6.1, 6.3**
    - Generate array tasks awal (N item) + string valid
    - Verifikasi `tasks.length === N + 1` dan task terakhir punya teks yang sesuai

  - [x] 3.5 Tulis property test untuk Property 4 (Input Cleared After Addition)
    - **Property 4: Input Cleared After Addition**
    - **Validates: Requirements 3.3**
    - Setelah `_addTask()` berhasil, verifikasi `shadowRoot.querySelector('#task-input').value === ''`

  - [x] 3.6 Implementasi `_handleDelete(id)` dan `_handleToggleComplete(id, checked)`
    - `_handleDelete`: `this.tasks = this.tasks.filter(task => task.id !== id)`
    - `_handleToggleComplete`: `this.tasks = this.tasks.map(task => task.id === id ? { ...task, completed: checked } : task)`
    - _Requirements: 4.2, 5.2, 5.3_

  - [x] 3.7 Tulis property test untuk Property 5 (Task Deletion Removes Exactly One Task)
    - **Property 5: Task Deletion Removes Exactly One Task**
    - **Validates: Requirements 4.2**
    - Generate array tasks (panjang ≥ 1), pilih index acak
    - Verifikasi panjang turun 1 dan tidak ada elemen dengan id yang sama

  - [x] 3.8 Tulis property test untuk Property 6 (Complete Toggle Round-Trip)
    - **Property 6: Complete Toggle Round-Trip**
    - **Validates: Requirements 5.2, 5.3**
    - Toggle task ke `true` lalu kembali ke `false`, verifikasi nilai akhir `completed === false`
    - Verifikasi nilai `completed` selalu mencerminkan state terakhir yang di-set

  - [x] 3.9 Implementasi event handler input (`_handleInputKeydown`, `_handleAddClick`)
    - `_handleInputKeydown`: panggil `_addTask()` jika `e.key === 'Enter'`
    - `_handleAddClick`: panggil `_addTask()`
    - _Requirements: 3.1, 3.2, 3.4_

  - [x] 3.10 Implementasi validasi panjang karakter di `_addTask()` dan error message UI
    - Tambahkan pengecekan: jika `text.length < 3` → set pesan error "min 3 karakter", return early
    - Tambahkan pengecekan: jika `text.length > 50` → set pesan error "maks 50 karakter", return early
    - Tambahkan reactive property `_validationError` (string, default `''`) untuk menyimpan pesan error
    - Render elemen `<p id="task-input-error" role="alert" class="validation-error">` di bawah input area; tampilkan hanya jika `_validationError` tidak kosong
    - Hapus `_validationError` ketika task berhasil ditambahkan (Requirement 10.5)
    - Hapus `_validationError` ketika panjang teks input menjadi 0 karakter (Requirement 10.6)
    - Gunakan DDD token `--ddd-theme-error` untuk warna teks error (Requirement 10.8)
    - _Requirements: 10.1, 10.2, 10.3, 10.4, 10.5, 10.6, 10.8_

  - [x] 3.11 Tambahkan key i18n untuk pesan validasi ke `this.t`
    - Tambahkan `validationErrorMinLength` dengan nilai default: `'Task must be at least 3 characters'`
    - Tambahkan `validationErrorMaxLength` dengan nilai default: `'Task must be no more than 50 characters'`
    - Gunakan key ini di `_addTask()` saat menetapkan `_validationError`
    - _Requirements: 10.7, 8.2_

  - [x] 3.12 Tambahkan aksesibilitas untuk error message (`aria-describedby` dan `role="alert"`)
    - Tambahkan atribut `aria-describedby="task-input-error"` pada elemen `<input id="task-input">`
    - Pastikan elemen error message menggunakan `role="alert"` agar screen reader mengumumkan otomatis
    - _Requirements: 9.5, 9.6_

- [x] 4. Checkpoint — Verifikasi logika bisnis dasar
  - Tasks 1–3.9 telah selesai diimplementasikan dan property tests 1–6 telah ditulis.
  - Tasks 3.10–3.12 (validasi panjang & error UI dari Requirement 10) masih perlu dikerjakan sebelum checkpoint ini dianggap sepenuhnya selesai.

- [x] 5. Implementasi rendering dan styles
  - [x] 5.1 Implementasi `static get styles()` dengan DDD tokens
    - Panggil `super.styles` untuk mewarisi DDD base styles
    - Definisikan semua class CSS (`:host`, `.input-area`, `.task-input`, `.add-button`, `.task-list`, `.task-item`, `.task-checkbox`, `.task-text`, `.task-text.completed`, `.delete-button`, `.empty-message`)
    - Gunakan hanya DDD CSS custom properties (tidak ada nilai hardcoded)
    - Tambahkan `:focus-visible` style pada semua elemen interaktif menggunakan DDD tokens
    - _Requirements: 5.4, 7.1, 7.2, 7.3, 7.4, 7.5, 9.4_

  - [x] 5.2 Implementasi `render()` — area input dan kondisi daftar kosong
    - Render `<label class="sr-only">` terhubung ke input via `for`/`id`
    - Render `<input id="task-input">` dengan `aria-label` dan placeholder dari `this.t`
    - Render Add Button dengan `aria-label` dari `this.t` dan handler `@click`
    - Render pesan kosong (`<p class="empty-message">`) jika `tasks.length === 0`
    - _Requirements: 3.1, 6.2, 8.2, 8.3, 9.1, 9.3_

  - [x] 5.3 Implementasi `_renderTask(task)` — rendering setiap item tugas
    - Render `<li class="task-item">` dengan `data-id`
    - Render `<input type="checkbox">` dengan `.checked`, `aria-checked`, `aria-label` dinamis dari `this.t`
    - Render `<span class="task-text ${task.completed ? 'completed' : ''}">` dengan teks task
    - Render Delete Button dengan `aria-label` kontekstual `"${this.t.deleteTask}: ${task.text}"`
    - Render `<ul class="task-list" aria-label="Task list">` yang memanggil `_renderTask` per task
    - _Requirements: 4.1, 4.3, 5.1, 5.4, 6.1, 6.3, 9.1, 9.2_

  - [x] 5.4 Tulis property test untuk Property 7 (Render Count Matches Tasks Length)
    - **Property 7: Render Count Matches Tasks Length**
    - **Validates: Requirements 6.1**
    - Generate array tasks dengan panjang acak N
    - Setelah render, verifikasi `shadowRoot.querySelectorAll('li.task-item').length === N`

  - [x] 5.5 Tulis property test untuk Property 8 (Per-Task Elements Invariant)
    - **Property 8: Per-Task Elements Invariant**
    - **Validates: Requirements 4.1, 5.1, 9.1**
    - Untuk setiap `<li>`, verifikasi ada tepat 1 checkbox, 1 `.task-text`, 1 `.delete-button` dengan `aria-label` non-empty

  - [ ]* 5.6 Tulis property test untuk Property 9 (Completed Task Visual Differentiation)
    - **Property 9: Completed Task Visual Differentiation**
    - **Validates: Requirements 5.4**
    - Task dengan `completed = true` → `<span>` punya class `completed`
    - Task dengan `completed = false` → `<span>` tidak punya class `completed`

  - [ ]* 5.7 Tulis property test untuk Property 10 (Rendering Order Preserves Insertion Order)
    - **Property 10: Rendering Order Preserves Insertion Order**
    - **Validates: Requirements 6.3**
    - Generate urutan penambahan T1..TN, verifikasi urutan `<li>` sesuai urutan penambahan

- [x] 5.8 Terapkan Polaris styling sesuai design.md
  - Update `:host` — tambahkan `padding: var(--ddd-spacing-8)`, `border-radius: var(--ddd-radius-lg)`, `box-shadow`, `max-width: 640px`, dan ganti background/color ke token Polaris dengan fallback
  - Update `.task-input` — ganti border ke `1.5px solid var(--ddd-theme-polaris-border, ...)`, border-radius ke `--ddd-radius-md`, tambahkan `outline: none` dan `transition`
  - Update `.task-input:focus` — ganti box-shadow ke `0 0 0 3px var(--ddd-theme-polaris-focus-ring, ...)`
  - Update `.add-button` — tambahkan `font-weight: var(--ddd-font-weight-bold)`, ganti border-radius ke `--ddd-radius-xl` (pill), tambahkan `border: none`, `transition`, `box-shadow`, dan token Polaris untuk background/color
  - Update `.add-button:hover` — gunakan `--ddd-theme-polaris-primary-hover` dengan fallback
  - Update `.add-button:focus-visible` — ganti ke `box-shadow: 0 0 0 3px` dengan Polaris focus-ring token
  - Update `.task-item` — ganti border-radius ke `--ddd-radius-lg`, background ke Polaris surface token, tambahkan `box-shadow`, `transition`, dan `.task-item:hover`
  - Update `.task-checkbox` — ganti `accent-color` ke `--ddd-theme-polaris-primary` dengan fallback, ganti `:focus-visible` ke box-shadow style
  - Update `.task-text` — tambahkan `line-height: 1.5`, ganti color ke `--ddd-theme-polaris-text` dengan fallback
  - Update `.delete-button` — tambahkan `font-weight: var(--ddd-font-weight-bold)`, ganti border-radius ke `--ddd-radius-md`, border ke `1.5px solid`, tambahkan `transition`
  - Update `.delete-button:focus-visible` — ganti ke `box-shadow: 0 0 0 3px rgba(...)` style
  - Update `.empty-message` — tambahkan `background`, `border: 1.5px dashed`, `border-radius: --ddd-radius-lg`, ganti padding ke `spacing-10 spacing-8`, font-size ke `--ddd-font-size-m`
  - Tambahkan `.todo-heading` class untuk heading opsional (font-size xl, font-weight bold, Polaris primary color)
  - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5_

- [x] 6. Implementasi demo page
  - [x] 6.1 Perbarui `demo/index.html` agar memuat komponen dan menggunakannya
    - Import `../todo-list.js` sebagai ES module
    - Tambahkan `<todo-list></todo-list>` dalam body halaman demo
    - _Requirements: 1.5_

- [~] 7. Checkpoint — Verifikasi rendering dan DDD compliance
  - Jalankan `npm test` dari `elements/todo-list/`
  - Jalankan `hax audit` untuk verifikasi DDD compliance
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 8. Implementasi unit tests untuk edge cases dan struktur komponen
  - [~] 8.1 Tulis unit tests untuk struktur komponen dan inisialisasi
    - Verifikasi `tasks` diinisialisasi sebagai `[]`
    - Verifikasi elemen `<input>` dan Add Button ada di shadowRoot
    - Verifikasi `this.t` mendefinisikan semua key i18n yang diperlukan
    - Verifikasi `haxProperties` menyertakan `canScale`, `canPosition`, `canEditSource`, `gizmo`, `settings`
    - _Requirements: 1.1, 1.2, 2.1, 8.2, 8.4_

  - [ ]* 8.2 Tulis unit tests untuk Complete Toggle dan aksesibilitas
    - Verifikasi Complete Toggle berupa `<input type="checkbox">`
    - Verifikasi Input Field memiliki `<label>` terhubung atau `aria-label`
    - Verifikasi pesan kosong tampil saat `tasks = []`
    - _Requirements: 5.1, 6.2, 9.2, 9.3_

- [~] 9. Final checkpoint — Build dan pre-PR checklist
  - Jalankan `npm test` — semua test harus lulus
  - Jalankan `npm run lint` — tidak ada lint error
  - Jalankan `hax audit` — DDD compliance terkonfirmasi
  - Jalankan `yarn run build` — `custom-elements.json` ter-generate
  - Ensure all tests pass, ask the user if questions arise.

---

## Notes

- Task bertanda `*` bersifat opsional dan dapat dilewati untuk MVP lebih cepat
- Design dokumen sudah menyediakan implementasi lengkap — gunakan sebagai referensi utama saat mengimplementasikan setiap task
- Setiap property test menggunakan `fast-check` dengan minimum 100 iterasi (`FC_RUNS = 100`)
- Seluruh string UI harus melalui `this.t` (I18NMixin) — tidak ada string hardcoded di template
- `custom-elements.json` di-generate otomatis via `yarn run build` — jangan edit manual
- Semua nilai CSS harus menggunakan DDD tokens — tidak ada nilai hardcoded (warna, spacing, font)
- Gunakan `crypto.randomUUID()` untuk ID task; fallback ke `Math.random().toString(36).slice(2)` + timestamp jika tidak tersedia
- Tasks 3.10–3.12 ditambahkan untuk Requirement 10 (validasi panjang karakter) dan Requirement 9.5–9.6 (aksesibilitas error message), yang tidak ada dalam tasks.md awal

## Task Dependency Graph

```json
{
  "waves": [
    { "id": 0, "tasks": ["2.1", "2.2"] },
    { "id": 1, "tasks": ["3.1", "3.6", "3.9"] },
    { "id": 2, "tasks": ["3.2", "3.3", "3.4", "3.5", "3.7", "3.8"] },
    { "id": 3, "tasks": ["3.10", "3.11", "3.12"] },
    { "id": 4, "tasks": ["5.1", "5.2", "5.3"] },
    { "id": 5, "tasks": ["5.4", "5.5", "5.6", "5.7", "5.8", "6.1"] },
    { "id": 6, "tasks": ["8.1", "8.2"] }
  ]
}
```
