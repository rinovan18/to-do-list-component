# Requirements Document

## Introduction

Komponen web `todo-list` adalah LitElement web component dalam monorepo HAX Webcomponents yang memungkinkan pengguna untuk mengelola daftar tugas sederhana. Komponen ini mendukung tiga operasi utama: menambah tugas baru, menghapus tugas yang ada, dan menandai tugas sebagai selesai. State disimpan di memori (tidak ada persistensi), menggunakan DDD design tokens untuk seluruh desain visual, dan mengintegrasikan `I18NMixin` untuk dukungan internasionalisasi. Komponen wajib menyertakan `haxProperties` untuk integrasi HAX authoring.

## Glossary

- **TodoList**: Komponen web utama `<todo-list>` yang di-scaffold di `elements/todo-list/todo-list.js`
- **Task**: Sebuah entri tugas dalam daftar, memiliki properti `text` (string), `completed` (boolean), dan `id` (string unik)
- **Task List**: Array of Task yang disimpan sebagai reactive property dalam memori komponen
- **DDD Token**: CSS custom property dari design system DDD (mis. `var(--ddd-spacing-4)`, `var(--ddd-theme-primary)`)
- **I18NMixin**: Mixin dari `@haxtheweb/i18n-manager/lib/I18NMixin.js` yang menyediakan dukungan terjemahan teks UI
- **DDDSuper**: Mixin dari `@haxtheweb/d-d-d/d-d-d.js` yang menyediakan integrasi design system DDD
- **haxProperties**: Static getter wajib pada komponen HAX yang mendefinisikan metadata authoring untuk HAX editor
- **Input Field**: Elemen `<input>` dalam komponen untuk menerima teks tugas baru
- **Add Button**: Tombol yang memicu penambahan tugas baru ke Task List
- **Delete Button**: Tombol per-tugas yang memicu penghapusan tugas dari Task List
- **Complete Toggle**: Elemen interaktif per-tugas (checkbox atau tombol) yang memicu perubahan status selesai suatu Task
- **Validation Error Message**: Pesan teks yang ditampilkan di bawah Input Field ketika validasi panjang karakter gagal
- **Min Length**: Panjang minimum karakter yang valid untuk teks tugas, yaitu 3 karakter (setelah trimming whitespace)
- **Max Length**: Panjang maksimum karakter yang valid untuk teks tugas, yaitu 50 karakter (setelah trimming whitespace)

---

## Requirements

### Requirement 1: Struktur Komponen Dasar

**User Story:** Sebagai developer HAX, saya ingin komponen `todo-list` mengikuti standar arsitektur monorepo HAX sehingga komponen dapat digunakan dan diaudit secara konsisten di seluruh ekosistem.

#### Acceptance Criteria

1. THE TodoList SHALL mengextend `I18NMixin(DDDSuper(LitElement))` sebagai rantai mixin komponen.
2. THE TodoList SHALL mendefinisikan static getter `haxProperties` yang berisi field `canScale`, `canPosition`, `canEditSource`, `gizmo`, dan `settings`.
3. THE TodoList SHALL menggunakan `globalThis.customElements.define('todo-list', TodoList)` untuk registrasi custom element.
4. THE TodoList SHALL mendefinisikan `static get tag()` yang mengembalikan string `'todo-list'`.
5. THE TodoList SHALL ditempatkan di `elements/todo-list/todo-list.js` dalam monorepo.

---

### Requirement 2: Manajemen State Tugas di Memori

**User Story:** Sebagai pengguna, saya ingin daftar tugas saya tersimpan selama sesi halaman berlangsung sehingga saya dapat bekerja dengan tugas tanpa kehilangan data selama berinteraksi.

#### Acceptance Criteria

1. THE TodoList SHALL mendeklarasikan reactive property `tasks` bertipe `Array` yang diinisialisasi sebagai array kosong `[]` di constructor.
2. WHEN state `tasks` berubah, THE TodoList SHALL me-render ulang tampilan daftar tugas secara otomatis melalui mekanisme reaktivitas LitElement.
3. IF halaman di-refresh atau komponen dilepas dari DOM, THEN THE TodoList SHALL tidak mempertahankan data tugas (tidak ada persistensi ke localStorage atau backend).
4. THE TodoList SHALL menyimpan setiap Task sebagai objek dengan properti `id` (string unik), `text` (string), dan `completed` (boolean).

---

### Requirement 3: Menambah Tugas Baru

**User Story:** Sebagai pengguna, saya ingin menambahkan tugas baru ke daftar sehingga saya dapat mencatat pekerjaan yang perlu dilakukan.

#### Acceptance Criteria

1. THE TodoList SHALL merender Input Field bertipe teks dan Add Button dalam area input.
2. WHEN Add Button diklik dan Input Field tidak kosong, THE TodoList SHALL menambahkan Task baru ke array `tasks` dengan `id` unik, `text` dari nilai Input Field, dan `completed` bernilai `false`.
3. WHEN Add Button diklik dan Input Field tidak kosong, THE TodoList SHALL mengosongkan nilai Input Field setelah Task berhasil ditambahkan.
4. WHEN pengguna menekan tombol Enter pada Input Field dan nilai Input Field tidak kosong, THE TodoList SHALL menambahkan Task baru dengan perilaku yang sama seperti klik Add Button.
5. IF nilai Input Field kosong atau hanya mengandung whitespace saat Add Button diklik atau Enter ditekan, THEN THE TodoList SHALL tidak menambahkan Task baru ke array `tasks`.
6. THE TodoList SHALL menggunakan label dan placeholder pada Input Field yang dapat diterjemahkan melalui I18NMixin.

---

### Requirement 4: Menghapus Tugas

**User Story:** Sebagai pengguna, saya ingin menghapus tugas dari daftar sehingga saya dapat menghilangkan tugas yang tidak relevan.

#### Acceptance Criteria

1. THE TodoList SHALL merender Delete Button pada setiap item Task dalam daftar.
2. WHEN Delete Button pada suatu Task diklik, THE TodoList SHALL menghapus Task tersebut dari array `tasks` berdasarkan `id`-nya.
3. WHEN sebuah Task dihapus, THE TodoList SHALL me-render ulang daftar tugas sehingga Task yang dihapus tidak lagi tampil.
4. THE TodoList SHALL menggunakan label Delete Button yang dapat diterjemahkan melalui I18NMixin.

---

### Requirement 5: Menandai Tugas Selesai

**User Story:** Sebagai pengguna, saya ingin menandai tugas sebagai selesai atau belum selesai sehingga saya dapat melacak progres pekerjaan saya.

#### Acceptance Criteria

1. THE TodoList SHALL merender Complete Toggle (checkbox) pada setiap item Task dalam daftar.
2. WHEN Complete Toggle pada suatu Task diaktifkan oleh pengguna, THE TodoList SHALL mengubah nilai `completed` Task tersebut menjadi `true`.
3. WHEN Complete Toggle pada suatu Task yang telah selesai dinonaktifkan oleh pengguna, THE TodoList SHALL mengubah nilai `completed` Task tersebut menjadi `false`.
4. WHILE nilai `completed` suatu Task adalah `true`, THE TodoList SHALL merender teks Task tersebut dengan gaya visual yang membedakannya dari tugas belum selesai (mis. `text-decoration: line-through` menggunakan DDD token).

---

### Requirement 6: Tampilan Daftar Tugas

**User Story:** Sebagai pengguna, saya ingin melihat seluruh daftar tugas saya dengan jelas sehingga saya dapat mengelola tugas secara efisien.

#### Acceptance Criteria

1. THE TodoList SHALL merender setiap Task dalam array `tasks` sebagai item daftar yang terpisah.
2. WHILE array `tasks` kosong, THE TodoList SHALL menampilkan pesan kosong yang dapat diterjemahkan melalui I18NMixin.
3. THE TodoList SHALL merender daftar tugas dalam urutan penambahan (FIFO — tugas terbaru berada di bawah).

---

### Requirement 7: Penggunaan DDD Design Tokens

**User Story:** Sebagai developer HAX, saya ingin komponen `todo-list` menggunakan DDD design tokens secara konsisten sehingga komponen selaras dengan design system dan lulus `hax audit`.

#### Acceptance Criteria

1. THE TodoList SHALL menggunakan DDD CSS custom properties untuk semua nilai font (mis. `var(--ddd-font-primary)`).
2. THE TodoList SHALL menggunakan DDD CSS custom properties untuk semua nilai spacing dan padding (mis. `var(--ddd-spacing-4)`).
3. THE TodoList SHALL menggunakan DDD CSS custom properties untuk semua nilai warna (mis. `var(--ddd-theme-primary)`, `var(--ddd-theme-accent)`).
4. THE TodoList SHALL tidak menggunakan nilai warna, font, atau spacing yang di-hardcode (mis. tidak ada `color: #333`, `padding: 8px`, `font-family: Arial`).
5. THE TodoList SHALL mendeklarasikan `static get styles()` yang memanggil `super.styles` untuk mewariskan DDD base styles.

---

### Requirement 8: Internasionalisasi (i18n)

**User Story:** Sebagai developer HAX, saya ingin semua teks UI komponen `todo-list` dapat diterjemahkan sehingga komponen dapat digunakan dalam konteks multibahasa.

#### Acceptance Criteria

1. THE TodoList SHALL menggunakan `I18NMixin` sebagai bagian dari rantai mixin warisan komponen.
2. THE TodoList SHALL mendefinisikan `this.t` di constructor untuk semua string UI yang terlihat oleh pengguna, termasuk label Add Button, placeholder Input Field, label Delete Button, dan pesan daftar kosong.
3. WHEN terjemahan tersedia melalui I18NMixin, THE TodoList SHALL menampilkan teks UI dalam bahasa yang sesuai.
4. THE TodoList SHALL menyediakan nilai default bahasa Inggris untuk semua string yang didefinisikan dalam `this.t`.

---

### Requirement 10: Validasi Panjang Karakter Teks Tugas

**User Story:** Sebagai pengguna, saya ingin mendapatkan umpan balik yang jelas ketika teks tugas yang saya masukkan terlalu pendek atau terlalu panjang, sehingga saya dapat memperbaiki input sebelum tugas ditambahkan ke daftar.

#### Acceptance Criteria

1. WHEN Add Button diklik atau tombol Enter ditekan dan panjang teks Input Field (setelah trimming whitespace) kurang dari 3 karakter, THEN THE TodoList SHALL tidak menambahkan Task baru ke array `tasks`.
2. WHEN Add Button diklik atau tombol Enter ditekan dan panjang teks Input Field (setelah trimming whitespace) lebih dari 50 karakter, THEN THE TodoList SHALL tidak menambahkan Task baru ke array `tasks`.
3. IF Add Button diklik atau tombol Enter ditekan dan panjang teks Input Field (setelah trimming whitespace) lebih dari 0 karakter dan kurang dari 3 karakter, THEN THE TodoList SHALL menampilkan Validation Error Message yang menyatakan teks tugas minimal 3 karakter.
4. IF Add Button diklik atau tombol Enter ditekan dan panjang teks Input Field (setelah trimming whitespace) lebih dari 50 karakter, THEN THE TodoList SHALL menampilkan Validation Error Message yang menyatakan teks tugas maksimal 50 karakter.
5. WHEN Input Field berisi teks yang valid (3–50 karakter setelah trimming) dan Task berhasil ditambahkan, THE TodoList SHALL menghapus Validation Error Message yang sebelumnya tampil.
6. WHEN panjang teks Input Field (setelah trimming whitespace) berubah menjadi 0 karakter, THE TodoList SHALL menghapus Validation Error Message yang sebelumnya tampil.
7. THE TodoList SHALL menggunakan label Validation Error Message yang dapat diterjemahkan melalui I18NMixin.
8. THE TodoList SHALL merender Validation Error Message menggunakan DDD CSS custom properties untuk warna error.

---

### Requirement 9: Aksesibilitas

**User Story:** Sebagai pengguna dengan kebutuhan aksesibilitas, saya ingin dapat menggunakan komponen `todo-list` dengan keyboard dan screen reader sehingga komponen dapat diakses oleh semua pengguna.

#### Acceptance Criteria

1. THE TodoList SHALL menyertakan atribut `aria-label` yang bermakna pada Add Button dan Delete Button.
2. THE TodoList SHALL memastikan setiap Complete Toggle berupa elemen `<input type="checkbox">` atau elemen dengan `role="checkbox"` dan atribut `aria-checked` yang sesuai.
3. THE TodoList SHALL memastikan Input Field memiliki elemen `<label>` yang terhubung secara eksplisit atau atribut `aria-label`.
4. WHEN fokus keyboard berada pada elemen interaktif komponen, THE TodoList SHALL menampilkan indikator fokus yang terlihat menggunakan DDD token.
5. WHEN Validation Error Message ditampilkan, THE TodoList SHALL menyertakan atribut `role="alert"` pada elemen Validation Error Message agar screen reader dapat mengumumkan pesan tersebut secara otomatis.
6. THE TodoList SHALL menghubungkan Input Field dengan Validation Error Message menggunakan atribut `aria-describedby` sehingga screen reader dapat mengasosiasikan pesan error dengan input yang bersangkutan.
