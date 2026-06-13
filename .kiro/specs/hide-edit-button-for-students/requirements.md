# Requirements Document

## Introduction

Fitur ini menambahkan properti `editable` (Boolean, default `false`) pada komponen web `<explode-quiz>` untuk mengontrol visibilitas tombol "Edit Soal Kuis" (`edit-questions-btn`). Saat ini tombol tersebut selalu tampil di `_renderNameScreen()` dan `_renderResultScreen()`, sehingga siswa pun dapat mengaksesnya. Dengan properti `editable`, tombol hanya terlihat ketika instruktur secara eksplisit mengaktifkan mode edit — siswa yang tidak memiliki atribut tersebut otomatis berada di mode tampilan-saja.

---

## Glossary

- **ExplodeQuiz**: Komponen web utama (`<explode-quiz>`) yang mengelola seluruh alur kuis, dibangun dengan LitElement + DDDSuper mixin.
- **Tombol_Edit**: Elemen `<button class="edit-questions-btn">` yang membuka Layar_Editor ketika diklik.
- **Layar_Nama**: Tampilan awal komponen tempat siswa memasukkan nama (`_screen === 'name'`).
- **Layar_Hasil**: Tampilan akhir komponen setelah semua soal dijawab (`_screen === 'result'`).
- **Layar_Editor**: Tampilan mode edit soal (`_screen === 'editor'`), hanya dapat diakses ketika `editable === true`.
- **Siswa**: Pengguna akhir yang mengikuti kuis; tidak memiliki izin untuk mengedit soal.
- **Instruktur**: Pembuat atau pengajar yang berhak mengedit soal kuis; mengaktifkan atribut `editable` pada tag HTML.
- **Properti_editable**: Properti publik Boolean pada ExplodeQuiz, default `false`, dengan `reflect: true`, yang mengontrol visibilitas Tombol_Edit.
- **Properti_editing**: Properti publik Boolean yang sudah ada (default `false`) yang mengontrol apakah Layar_Editor sedang ditampilkan — berbeda dari Properti_editable.
- **haxProperties**: Metadata statis komponen yang memungkinkan integrasi ke HAX authoring editor.
- **HAX**: Headless Authoring eXperience — platform CMS tempat instruktur dapat mengonfigurasi komponen secara visual.
- **DDDSuper**: Mixin desain sistem DDD dari `@haxtheweb/d-d-d/d-d-d.js`.
- **Token_DDD**: CSS custom property dari sistem DDD (contoh: `var(--ddd-spacing-4)`, `var(--ddd-theme-primary)`).

---

## Requirements

### Requirement 1: Properti `editable` pada Komponen

**User Story:** Sebagai developer HAX, saya ingin komponen `<explode-quiz>` memiliki properti `editable` yang terdaftar secara publik, agar perilaku visibilitas tombol edit dapat dikontrol melalui atribut HTML maupun HAX editor.

#### Acceptance Criteria

1. THE ExplodeQuiz SHALL mendefinisikan properti `editable` bertipe Boolean dalam `static get properties()` dengan `reflect: true` sehingga nilai properti selalu tersinkronisasi dengan atribut HTML `editable`.
2. THE ExplodeQuiz SHALL menginisialisasi `editable` bernilai `false` sehingga komponen baru tanpa atribut `editable` tidak menampilkan Tombol_Edit.
3. IF atribut HTML `editable` tidak ditulis pada tag `<explode-quiz>`, THEN THE ExplodeQuiz SHALL memperlakukan nilai `editable` sebagai `false` dan tidak merender Tombol_Edit ke dalam DOM.
4. WHEN atribut HTML `editable` ditulis pada tag `<explode-quiz>` tanpa nilai (contoh: `<explode-quiz editable>`), THE ExplodeQuiz SHALL memperlakukan nilai `editable` sebagai `true` dan merender Tombol_Edit ke dalam DOM.
5. THE Properti_editable SHALL bersifat independen dari Properti_editing: perubahan nilai `editable` tidak mengubah nilai `editing`, dan sebaliknya.
6. WHILE `editable === false`, THE ExplodeQuiz SHALL tidak merender Tombol_Edit di Layar_Nama maupun Layar_Hasil.
7. WHILE `editable === true`, THE ExplodeQuiz SHALL merender Tombol_Edit di Layar_Nama dan Layar_Hasil sehingga instruktur dapat mengkliknya untuk membuka Layar_Editor.

---

### Requirement 2: Visibilitas Tombol Edit di Layar_Nama

**User Story:** Sebagai siswa, saya tidak ingin melihat tombol "Edit Soal Kuis" di Layar_Nama, agar saya tidak tergoda atau bingung dengan fungsi yang tidak seharusnya saya gunakan.

#### Acceptance Criteria

1. WHILE `editable === false`, THE ExplodeQuiz SHALL tidak merender Tombol_Edit di dalam DOM pada Layar_Nama (elemen tidak ada dalam shadow DOM, bukan sekadar tersembunyi via CSS).
2. WHILE `editable === true`, THE ExplodeQuiz SHALL merender Tombol_Edit di Layar_Nama sehingga tombol tersebut dapat ditemukan di shadow DOM.
3. WHEN Tombol_Edit di Layar_Nama diklik dan `editable === true`, THE ExplodeQuiz SHALL menampilkan Layar_Editor menggantikan Layar_Nama (`_screen` berubah menjadi `'editor'`).
4. WHEN nilai `editable` berubah dari `false` menjadi `true` pada saat Layar_Nama aktif, THE ExplodeQuiz SHALL memperbarui tampilan untuk menampilkan Tombol_Edit dalam satu siklus render LitElement (tidak memerlukan reload halaman).
5. WHEN nilai `editable` berubah dari `true` menjadi `false` pada saat Layar_Nama aktif, THE ExplodeQuiz SHALL memperbarui tampilan untuk menghapus Tombol_Edit dari DOM dalam satu siklus render LitElement (tidak memerlukan reload halaman).

---

### Requirement 3: Visibilitas Tombol Edit di Layar_Hasil

**User Story:** Sebagai siswa, saya tidak ingin melihat tombol "Edit Soal Kuis" di Layar_Hasil, agar halaman hasil terasa bersih dan fokus pada nilai yang saya peroleh.

#### Acceptance Criteria

1. WHILE `editable === false`, THE ExplodeQuiz SHALL tidak merender Tombol_Edit di dalam DOM pada Layar_Hasil (elemen tidak ada dalam shadow DOM, bukan sekadar tersembunyi via CSS).
2. WHILE `editable === true`, THE ExplodeQuiz SHALL merender Tombol_Edit di Layar_Hasil sehingga tombol tersebut dapat ditemukan di shadow DOM.
3. WHEN Tombol_Edit di Layar_Hasil diklik dan `editable === true`, THE ExplodeQuiz SHALL menampilkan Layar_Editor menggantikan Layar_Hasil (`_screen` berubah menjadi `'editor'`).
4. WHEN nilai `editable` berubah dari `false` menjadi `true` pada saat Layar_Hasil aktif, THE ExplodeQuiz SHALL memperbarui tampilan untuk menampilkan Tombol_Edit dalam satu siklus render LitElement (tidak memerlukan reload halaman).
5. WHEN nilai `editable` berubah dari `true` menjadi `false` pada saat Layar_Hasil aktif, THE ExplodeQuiz SHALL memperbarui tampilan untuk menghapus Tombol_Edit dari DOM dalam satu siklus render LitElement (tidak memerlukan reload halaman).

---

### Requirement 4: Integrasi HAX untuk Properti `editable`

**User Story:** Sebagai instruktur yang menggunakan HAX editor, saya ingin dapat mengaktifkan properti `editable` melalui antarmuka konfigurasi visual, agar saya tidak perlu mengedit HTML secara manual untuk mengizinkan pengeditan soal.

#### Acceptance Criteria

1. THE ExplodeQuiz SHALL menambahkan entri untuk properti `editable` ke dalam array `settings.configure` di dalam `static get haxProperties()`.
2. THE entri `editable` di `haxProperties` SHALL mendefinisikan `property: 'editable'`, `title: 'Mode Edit (Instruktur)'`, dan `inputMethod: 'boolean'`.
3. WHEN instruktur mengaktifkan toggle `editable` di HAX editor, THE ExplodeQuiz SHALL memperbarui nilai properti `editable` menjadi `true` sehingga Tombol_Edit hadir di dalam DOM di Layar_Nama dan Layar_Hasil.
4. WHEN instruktur menonaktifkan toggle `editable` di HAX editor, THE ExplodeQuiz SHALL memperbarui nilai properti `editable` menjadi `false` sehingga Tombol_Edit tidak ada di dalam DOM di Layar_Nama dan Layar_Hasil.

---

### Requirement 5: Backward Compatibility

**User Story:** Sebagai developer yang telah men-deploy komponen `<explode-quiz>` sebelumnya, saya ingin komponen tetap berfungsi seperti semula tanpa perubahan konfigurasi apapun, agar pembaruan ini tidak merusak penggunaan yang sudah ada.

#### Acceptance Criteria

1. WHEN komponen `<explode-quiz>` di-render tanpa atribut `editable`, THE ExplodeQuiz SHALL menampilkan mode siswa dengan Tombol_Edit tidak ada di dalam DOM di Layar_Nama dan Layar_Hasil.
2. THE ExplodeQuiz SHALL mempertahankan seluruh perilaku yang didefinisikan di Requirement 2 (Layar Input Nama), Requirement 3 (Navigasi Soal), Requirement 4 (Umpan Balik Instan), Requirement 5 (Efek Konfeti), Requirement 6 (Tampilan Skor Real-Time), Requirement 7 (Layar Hasil Akhir), dan Requirement 8 (Integrasi Google Sheets) tanpa perubahan apapun akibat penambahan Properti_editable.
3. THE ExplodeQuiz SHALL mempertahankan nilai default `editing: false` dan seluruh logika Layar_Editor yang didefinisikan di Requirement 14 (Interactive Question Editor UI) tanpa modifikasi.
4. IF atribut HTML `editable` diset ke nilai string selain string kosong atau `"true"` (contoh: `editable="false"`, `editable="0"`, `editable=""`), THEN THE ExplodeQuiz SHALL memperlakukan nilai tersebut sebagai `false` dan tidak merender Tombol_Edit ke dalam DOM.
5. WHEN atribut HTML `editable` ditulis tanpa nilai (`<explode-quiz editable>`), THE ExplodeQuiz SHALL memperlakukan nilai `editable` sebagai `true` sesuai semantik atribut boolean HTML standar.

---

### Requirement 6: Aksesibilitas Tombol Edit yang Disembunyikan

**User Story:** Sebagai pengguna yang bergantung pada navigasi keyboard atau pembaca layar, saya tidak ingin menemukan tombol yang tidak terlihat dalam urutan fokus atau daftar elemen yang dapat difokus, agar pengalaman navigasi saya tetap konsisten dan tidak membingungkan.

#### Acceptance Criteria

1. WHILE `editable === false`, THE ExplodeQuiz SHALL memastikan Tombol_Edit tidak dapat difokus menggunakan navigasi keyboard (Tab) di Layar_Nama maupun Layar_Hasil karena elemen tersebut tidak ada di dalam DOM.
2. WHILE `editable === false`, THE ExplodeQuiz SHALL memastikan Tombol_Edit tidak dapat dideteksi oleh pembaca layar sebagai elemen interaktif di Layar_Nama maupun Layar_Hasil karena elemen tersebut tidak ada di dalam accessibility tree.
3. WHILE `editable === true`, THE ExplodeQuiz SHALL memastikan Tombol_Edit memiliki atribut `aria-label` yang mengidentifikasi aksi dan konteks (contoh: `"Buka editor soal kuis"`) agar dapat dibaca dengan benar oleh pembaca layar.
4. THE ExplodeQuiz SHALL mengimplementasikan penyembunyian Tombol_Edit dengan tidak merender elemen ke dalam DOM (conditional rendering) sehingga Tombol_Edit tidak ada di DOM maupun accessibility tree ketika `editable === false`.
