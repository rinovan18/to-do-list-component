# Requirements Document

## Introduction

`todo-list` adalah web component LitElement berbasis HAX ecosystem yang memungkinkan pengguna mengelola daftar tugas (tasks) secara interaktif. Komponen ini menggunakan `DDDSuper` mixin dari design system DDD, mendukung i18n via `I18NMixin`, dan terintegrasi dengan HAX authoring melalui `haxProperties`. Komponen ini di-publish di bawah scope npm `@haxtheweb/todo-list` sebagai pure JavaScript ES module tanpa kompilasi.

---

## Glossary

- **TodoList**: Web component utama dengan tag `<todo-list>` yang menjadi subjek spesifikasi ini.
- **Task**: Objek data yang merepresentasikan satu item tugas, dengan properti `id` (string unik), `text` (string konten), dan `completed` (boolean status).
- **Task_Input**: Elemen `<input type="text" id="task-input">` di dalam shadow DOM untuk memasukkan teks tugas baru.
- **Add_Button**: Elemen `<button class="add-button">` untuk memicu penambahan tugas.
- **Task_List**: Elemen `<ul class="task-list">` yang merender semua task aktif.
- **Task_Item**: Elemen `<li class="task-item">` yang merepresentasikan satu task dalam Task_List.
- **Delete_Button**: Elemen `<button class="delete-button">` di dalam setiap Task_Item untuk menghapus task.
- **Checkbox**: Elemen `<input type="checkbox" class="task-checkbox">` di dalam setiap Task_Item untuk toggle status `completed`.
- **Task_Text**: Elemen `<span class="task-text">` yang menampilkan teks task.
- **Validation_Error**: Pesan kesalahan yang ditampilkan saat input tidak memenuhi syarat.
- **Empty_State**: Kondisi saat daftar task kosong; ditampilkan sebagai pesan `<p class="empty-message">`.
- **DDDSuper**: Mixin dari `@haxtheweb/d-d-d/d-d-d.js` yang menyediakan akses ke semua DDD design tokens.
- **I18NMixin**: Mixin dari `@haxtheweb/i18n-manager/lib/I18NMixin.js` untuk internasionalisasi string UI.
- **haxProperties**: Static getter yang menyediakan metadata integrasi dengan HAX authoring editor.
- **DDD_Token**: CSS custom property yang berasal dari sistem desain DDD (contoh: `--ddd-spacing-4`, `--ddd-theme-primary`).

---

## Requirements

### Requirement 1: Struktur Dasar Web Component

**User Story:** Sebagai developer HAX, saya ingin komponen `todo-list` tersedia sebagai custom element yang valid, agar bisa digunakan di halaman HTML mana pun dengan tag `<todo-list>`.

#### Acceptance Criteria

1. THE TodoList SHALL mendefinisikan custom element dengan tag `todo-list` menggunakan `globalThis.customElements.define`.
2. THE TodoList SHALL mewarisi dari `I18NMixin(DDDSuper(LitElement))` untuk mendapatkan integrasi DDD design system dan dukungan i18n.
3. THE TodoList SHALL menyertakan `static get tag()` yang mengembalikan string `"todo-list"`.
4. WHEN komponen dirender, THE TodoList SHALL menggunakan shadow DOM melalui mekanisme LitElement standar.
5. THE TodoList SHALL mengekspor class komponen sehingga dapat di-import oleh file lain sebagai ES module.

---

### Requirement 2: Model Data Task

**User Story:** Sebagai pengguna, saya ingin setiap tugas memiliki struktur data yang konsisten, agar status dan identitas setiap tugas dapat diandalkan.

#### Acceptance Criteria

1. THE TodoList SHALL mendeklarasikan properti reaktif `tasks` bertipe Array yang diinisialisasi sebagai array kosong `[]` pada constructor.
2. WHEN sebuah Task ditambahkan, THE TodoList SHALL memastikan setiap Task memiliki properti `id` bertipe string yang tidak kosong.
3. WHEN sebuah Task ditambahkan, THE TodoList SHALL memastikan setiap Task memiliki properti `text` yang sama dengan input pengguna setelah di-trim.
4. WHEN sebuah Task ditambahkan, THE TodoList SHALL memastikan nilai awal properti `completed` pada Task baru adalah `false`.
5. THE TodoList SHALL menggunakan `crypto.randomUUID()` untuk menghasilkan `id` Task, dengan fallback ke `Math.random().toString(36)` + timestamp apabila `crypto` tidak tersedia.

---

### Requirement 3: Penambahan Task

**User Story:** Sebagai pengguna, saya ingin menambahkan tugas baru melalui input teks dan tombol "Add", agar daftar tugas saya dapat bertambah.

#### Acceptance Criteria

1. WHEN pengguna mengklik Add_Button, THE TodoList SHALL memanggil fungsi `_addTask()` untuk memproses penambahan task.
2. WHEN pengguna menekan tombol `Enter` pada Task_Input, THE TodoList SHALL memanggil fungsi `_addTask()` untuk memproses penambahan task.
3. WHEN `_addTask()` berhasil menambahkan task, THE TodoList SHALL mengosongkan nilai Task_Input menjadi string kosong `""` dan mengembalikan fokus ke Task_Input.
4. WHEN `_addTask()` berhasil menambahkan task, THE TodoList SHALL menambahkan Task baru ke akhir array `tasks` sehingga `tasks.length` bertambah tepat 1.
5. IF nilai Task_Input setelah di-trim hanya berisi whitespace atau merupakan string kosong, THEN THE TodoList SHALL tidak menambahkan task baru dan tidak mengubah panjang array `tasks`.
6. IF nilai Task_Input setelah di-trim memiliki panjang kurang dari 3 karakter, THEN THE TodoList SHALL menampilkan Validation_Error dengan pesan minimum-length tanpa menambahkan task.
7. IF nilai Task_Input setelah di-trim memiliki panjang lebih dari 50 karakter, THEN THE TodoList SHALL menampilkan Validation_Error dengan pesan maximum-length tanpa menambahkan task.
8. WHEN pengguna mengubah nilai Task_Input menjadi string kosong, THE TodoList SHALL menghapus Validation_Error yang sedang ditampilkan.

---

### Requirement 4: Penghapusan Task

**User Story:** Sebagai pengguna, saya ingin menghapus task yang tidak relevan, agar daftar tugas tetap bersih.

#### Acceptance Criteria

1. WHEN pengguna mengklik Delete_Button pada sebuah Task_Item, THE TodoList SHALL memanggil `_handleDelete(id)` dengan `id` task yang bersesuaian.
2. WHEN `_handleDelete(id)` dipanggil dengan `id` task yang ada, THE TodoList SHALL menghapus tepat satu task dari array `tasks` sehingga `tasks.length` berkurang tepat 1.
3. WHEN `_handleDelete(id)` dipanggil, THE TodoList SHALL memastikan tidak ada task dengan `id` yang sama yang tersisa di array `tasks` setelah penghapusan.
4. WHEN `_handleDelete(id)` dipanggil, THE TodoList SHALL memastikan semua task lain yang tidak dihapus tetap ada di array `tasks` tanpa perubahan.

---

### Requirement 5: Toggle Status Selesai (Completed)

**User Story:** Sebagai pengguna, saya ingin menandai task sebagai selesai atau belum selesai, agar saya dapat melacak progres pekerjaan saya.

#### Acceptance Criteria

1. WHEN pengguna mengubah state Checkbox pada sebuah Task_Item, THE TodoList SHALL memanggil `_handleToggleComplete(id, checked)` dengan `id` task dan nilai boolean dari checkbox.
2. WHEN `_handleToggleComplete(id, boolValue)` dipanggil, THE TodoList SHALL memperbarui properti `completed` task yang bersesuaian menjadi tepat sama dengan `boolValue`.
3. WHEN `_handleToggleComplete(id, true)` diikuti `_handleToggleComplete(id, false)` dipanggil pada task yang sama, THE TodoList SHALL mengembalikan `completed` task tersebut ke nilai `false` (round-trip invariant).
4. WHEN `_handleToggleComplete(id, boolValue)` dipanggil pada satu task, THE TodoList SHALL memastikan nilai `completed` semua task lain tidak berubah.
5. WHEN sebuah Task memiliki `completed === true`, THE TodoList SHALL merender Task_Text dengan CSS class `completed` pada elemen `<span class="task-text">`.
6. WHEN sebuah Task memiliki `completed === false`, THE TodoList SHALL merender Task_Text tanpa CSS class `completed` pada elemen `<span class="task-text">`.

---

### Requirement 6: Rendering Daftar Task

**User Story:** Sebagai pengguna, saya ingin melihat semua task yang saya tambahkan tersusun secara berurutan, agar saya dapat memantau daftar pekerjaan dengan jelas.

#### Acceptance Criteria

1. WHEN array `tasks` memiliki N elemen, THE TodoList SHALL merender tepat N elemen `<li class="task-item">` di dalam `<ul class="task-list">`.
2. WHEN array `tasks` kosong, THE TodoList SHALL menampilkan elemen `<p class="empty-message">` dan tidak merender `<ul class="task-list">`.
3. THE TodoList SHALL merender Task_Item dalam urutan yang sama dengan urutan elemen di array `tasks` (FIFO — First In First Out).
4. WHEN merender setiap Task_Item, THE TodoList SHALL menyertakan atribut `data-id` pada elemen `<li>` yang berisi `id` task yang bersesuaian.
5. WHEN array `tasks` diperbarui, THE TodoList SHALL merefleksikan perubahan secara reaktif pada tampilan tanpa memerlukan refresh halaman.

---

### Requirement 7: Struktur Elemen Per Task Item

**User Story:** Sebagai developer HAX, saya ingin setiap task item memiliki elemen yang konsisten dan dapat diprediksi, agar test dan interaksi terhadap komponen berjalan andal.

#### Acceptance Criteria

1. THE TodoList SHALL merender tepat 1 elemen `<input type="checkbox">` di dalam setiap `<li class="task-item">`.
2. THE TodoList SHALL merender tepat 1 elemen dengan class `.task-text` di dalam setiap `<li class="task-item">`.
3. THE TodoList SHALL merender tepat 1 elemen dengan class `.delete-button` di dalam setiap `<li class="task-item">`.
4. THE TodoList SHALL memastikan setiap `.delete-button` memiliki atribut `aria-label` yang tidak kosong.

---

### Requirement 8: Styling dengan DDD Design Tokens

**User Story:** Sebagai developer HAX, saya ingin komponen menggunakan DDD design tokens untuk semua nilai visual, agar tampilan konsisten dengan sistem desain HAX dan lulus `hax audit`.

#### Acceptance Criteria

1. THE TodoList SHALL menggunakan `var(--ddd-font-primary)` untuk semua deklarasi `font-family` dalam style komponen.
2. THE TodoList SHALL menggunakan DDD_Token `--ddd-spacing-*` untuk semua nilai `padding`, `margin`, dan `gap`; tidak boleh ada nilai hardcoded.
3. THE TodoList SHALL menggunakan DDD_Token `--ddd-theme-*` untuk semua nilai warna teks, latar belakang, border, dan fokus; tidak boleh ada hex/rgb hardcoded.
4. THE TodoList SHALL menggunakan DDD_Token `--ddd-radius-*` untuk semua nilai `border-radius`.
5. THE TodoList SHALL mewarisi styles dari `super.styles` agar styles DDDSuper parent tetap diterapkan.
6. WHEN elemen interaktif (input, button, checkbox) mendapat fokus via keyboard, THE TodoList SHALL menampilkan focus ring menggunakan DDD_Token `--ddd-theme-polaris-focus-ring` atau `--ddd-theme-link-light`.

---

### Requirement 9: Aksesibilitas (WCAG 2.0 AA)

**User Story:** Sebagai pengguna dengan kebutuhan aksesibilitas, saya ingin komponen dapat dioperasikan sepenuhnya via keyboard dan screen reader, agar semua pengguna dapat menggunakan todo-list secara setara.

#### Acceptance Criteria

1. THE TodoList SHALL menyertakan atribut `aria-label` yang tidak kosong pada setiap Delete_Button, dengan nilai yang mengidentifikasi task yang akan dihapus (contoh: `"Delete task: <text task>"`).
2. THE TodoList SHALL menyertakan atribut `aria-label` pada Checkbox yang berubah berdasarkan status `completed` task (contoh: `"Mark as complete"` / `"Mark as incomplete"`).
3. THE TodoList SHALL menyertakan atribut `aria-checked` pada setiap Checkbox yang mencerminkan nilai boolean `completed`.
4. THE TodoList SHALL menyertakan atribut `aria-label` pada elemen `<ul class="task-list">` dengan nilai yang mendeskripsikan daftar (contoh: `"Task list"`).
5. WHEN Validation_Error ditampilkan, THE TodoList SHALL merender elemen error dengan atribut `role="alert"` agar screen reader mengumumkan pesan error secara otomatis.
6. THE TodoList SHALL memastikan Task_Input memiliki atribut `aria-describedby` yang merujuk ke elemen Validation_Error.
7. THE TodoList SHALL memastikan semua elemen interaktif dapat dijangkau dan dioperasikan menggunakan navigasi keyboard (Tab, Enter, Space).

---

### Requirement 10: Internasionalisasi (i18n)

**User Story:** Sebagai developer yang mengintegrasikan komponen ke aplikasi multibahasa, saya ingin semua string UI dapat dilokalkan, agar komponen dapat digunakan dalam berbagai bahasa.

#### Acceptance Criteria

1. THE TodoList SHALL mendefinisikan objek `this.t` pada constructor yang berisi semua string UI yang dapat dilokalisasi.
2. THE TodoList SHALL menggunakan `this.t.addTask` sebagai label pada Add_Button dan `aria-label` pada Task_Input.
3. THE TodoList SHALL menggunakan `this.t.inputPlaceholder` sebagai atribut `placeholder` pada Task_Input.
4. THE TodoList SHALL menggunakan `this.t.deleteTask` sebagai label pada setiap Delete_Button.
5. THE TodoList SHALL menggunakan `this.t.emptyMessage` sebagai teks pada elemen Empty_State.
6. THE TodoList SHALL menggunakan `this.t.validationErrorMinLength` sebagai pesan Validation_Error saat input kurang dari 3 karakter.
7. THE TodoList SHALL menggunakan `this.t.validationErrorMaxLength` sebagai pesan Validation_Error saat input lebih dari 50 karakter.
8. THE TodoList SHALL menggunakan `this.t.taskCompleted` dan `this.t.taskIncomplete` sebagai `aria-label` pada Checkbox sesuai status `completed` task.

---

### Requirement 11: Integrasi HAX Authoring

**User Story:** Sebagai content author yang menggunakan HAX editor, saya ingin komponen `todo-list` dapat ditemukan dan dikonfigurasi melalui antarmuka HAX, agar saya dapat menyisipkan dan mengedit komponen tanpa menyentuh kode.

#### Acceptance Criteria

1. THE TodoList SHALL menyertakan static getter `haxProperties` yang mengembalikan objek konfigurasi HAX yang valid.
2. THE `haxProperties` SHALL mendefinisikan properti `gizmo` yang berisi `title`, `description`, `icon`, `color`, dan `tags` untuk keperluan discovery di HAX palette.
3. THE `haxProperties` SHALL mendefinisikan properti `settings` dengan sub-properti `configure` dan `advanced` (masing-masing berupa array).
4. THE `haxProperties` SHALL mendefinisikan `canScale`, `canPosition`, dan `canEditSource` sebagai nilai boolean yang sesuai dengan kapabilitas komponen.

---

### Requirement 12: Ketersediaan Komponen sebagai npm Package

**User Story:** Sebagai developer yang menggunakan monorepo HAX, saya ingin komponen `todo-list` dapat diinstal dan diimpor sebagai package `@haxtheweb/todo-list`, agar dapat digunakan sebagai dependency di komponen atau proyek lain.

#### Acceptance Criteria

1. THE TodoList SHALL didefinisikan dalam file `todo-list.js` sebagai ES module yang dapat diimpor langsung.
2. THE `package.json` SHALL mendefinisikan `name` sebagai `"@haxtheweb/todo-list"` sesuai scope npm monorepo HAX.
3. THE `package.json` SHALL mencantumkan `@haxtheweb/d-d-d`, `@haxtheweb/i18n-manager`, dan `lit` sebagai `peerDependencies`.
4. THE `package.json` SHALL mendefinisikan field `main` dan `module` yang mengarah ke `todo-list.js`.
