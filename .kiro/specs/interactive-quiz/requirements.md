# Requirements Document

## Introduction

Fitur ini adalah komponen web kuis pilihan ganda interaktif (`explode-quiz`) yang dibangun menggunakan LitElement dan DDDSuper mixin dalam monorepo HAX webcomponents. Komponen ini memungkinkan siswa menjawab soal pilihan ganda satu per satu, mendapatkan umpan balik instan, melihat efek konfeti saat menjawab benar, serta mengirimkan hasil akhir (nama, skor, waktu) ke Google Sheets melalui Google Apps Script. Komponen ditempatkan di `elements/explode/` dengan nama file utama `explode-quiz.js`.

---

## Properties

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `questions` | Array | `[]` | Array of question objects for the quiz |
| `editing` | Boolean | `false` | Enables question editor UI when `true` |
| `scriptUrl` | String | `undefined` | URL of Google Apps Script deployment (for non-GAS hosting) |
| `scriptFunctionName` | String | `'submitQuizResult'` | Name of the GAS function to call |

---

## Glossary

- **ExplodeQuiz**: Komponen web utama (`<explode-quiz>`) yang mengelola seluruh alur kuis.
- **Soal**: Satu butir pertanyaan pilihan ganda beserta empat pilihan jawaban dan satu kunci jawaban.
- **Daftar_Soal**: Kumpulan objek Soal yang dimuat ke dalam komponen.
- **Sesi_Kuis**: Satu putaran kuis yang dimulai setelah pengguna memasukkan nama dan berakhir saat semua Soal telah dijawab.
- **Skor**: Jumlah jawaban benar yang dikumpulkan selama Sesi_Kuis.
- **Siswa**: Pengguna akhir yang mengikuti kuis dan memasukkan namanya di layar awal.
- **Konfeti**: Efek visual partikel yang ditampilkan via library `canvas-confetti` saat jawaban benar dipilih.
- **Umpan_Balik**: Pesan teks singkat yang ditampilkan sesaat setelah Siswa memilih jawaban.
- **Layar_Nama**: Tampilan awal untuk memasukkan nama Siswa sebelum kuis dimulai.
- **Layar_Soal**: Tampilan yang memperlihatkan satu Soal beserta pilihan jawaban.
- **Layar_Hasil**: Tampilan akhir yang memperlihatkan Skor total dan pesan apresiasi.
- **SheetsConnector**: Fungsi internal yang bertugas mengirim data ke Google Sheets via `google.script.run`.
- **DDDSuper**: Mixin desain sistem DDD dari `@haxtheweb/d-d-d/d-d-d.js`.
- **I18NMixin**: Mixin internasionalisasi dari `@haxtheweb/i18n-manager/lib/I18NMixin.js`.
- **Token_DDD**: CSS custom property dari sistem DDD (contoh: `var(--ddd-spacing-4)`, `var(--ddd-theme-primary)`).
- **google_script_run**: API global yang disediakan oleh Google Apps Script untuk komunikasi antara halaman web tertanam dan server-side script.
- **haxProperties**: Metadata statis komponen yang memungkinkan integrasi ke HAX authoring dengan property editor, gizmo icon, dan tag selection.
- **Google Apps Script (GAS)**: Platform serverless Google yang mengeksekusi fungsi di sisi server untuk menulis data ke Google Sheets.
- **Google Sheets**: Spreadsheet online tempat hasil kuis disimpan dan dapat diakses instruktur.

---

## Requirements

### Requirement 1: Arsitektur dan Inisialisasi Komponen

**User Story:** Sebagai developer HAX, saya ingin komponen `explode-quiz` mengikuti konvensi monorepo HAX webcomponents, agar komponen dapat diintegrasikan ke ekosistem HAX tanpa modifikasi tambahan.

#### Acceptance Criteria

1. THE ExplodeQuiz SHALL mewarisi dari `I18NMixin(DDDSuper(LitElement))`.
2. THE ExplodeQuiz SHALL mendaftarkan custom element dengan tag `explode-quiz` menggunakan `globalThis.customElements.define`.
3. THE ExplodeQuiz SHALL mendefinisikan properti `static get tag()` yang mengembalikan string `'explode-quiz'`.
4. THE ExplodeQuiz SHALL mengekspor properti `static get haxProperties()` yang berisi metadata gizmo untuk integrasi HAX authoring.
5. THE ExplodeQuiz SHALL mengimpor `canvas-confetti` hanya dari distribusi JavaScript yang sudah ter-compile (bukan dari sumber TypeScript).
6. THE ExplodeQuiz SHALL menggunakan hanya Token_DDD untuk semua nilai desain (warna, spasi, tipografi) tanpa nilai hard-coded.

---

### Requirement 2: Layar Input Nama

**User Story:** Sebagai Siswa, saya ingin memasukkan nama saya sebelum kuis dimulai, agar hasil kuis dapat diidentifikasi dengan jelas di Google Sheets.

#### Acceptance Criteria

1. WHEN ExplodeQuiz pertama kali dirender, THE ExplodeQuiz SHALL menampilkan Layar_Nama dengan kolom input teks dan tombol mulai.
2. WHEN Siswa mengklik tombol mulai dengan kolom nama kosong, THE ExplodeQuiz SHALL menampilkan pesan validasi yang meminta nama diisi terlebih dahulu.
3. WHEN Siswa mengklik tombol mulai dengan nama yang telah diisi (lebih dari 2 karakter), THE ExplodeQuiz SHALL menyimpan nama Siswa dan berpindah ke Layar_Soal pertama.
4. WHEN Siswa menekan tombol Enter pada kolom input nama dengan nama yang memiliki lebih dari 2 karakter, THE ExplodeQuiz SHALL memperlakukannya setara dengan mengklik tombol mulai.
5. THE Layar_Nama SHALL menampilkan judul kuis dan instruksi singkat kepada Siswa.
6. IF nama Siswa memiliki 2 karakter atau kurang, THEN THE ExplodeQuiz SHALL mencegah perpindahan ke Layar_Soal dan menampilkan pesan validasi.

---

### Requirement 3: Navigasi Soal

**User Story:** Sebagai Siswa, saya ingin melihat satu soal dalam satu waktu, agar saya dapat fokus menjawab tanpa gangguan soal lainnya.

#### Acceptance Criteria

1. THE Layar_Soal SHALL menampilkan teks pertanyaan, nomor urut soal (contoh: "Soal 1 dari 3"), dan empat pilihan jawaban dalam bentuk tombol.
2. WHEN Siswa memilih salah satu pilihan jawaban, THE ExplodeQuiz SHALL menonaktifkan seluruh tombol jawaban untuk Soal tersebut agar jawaban tidak dapat diubah.
3. WHEN Siswa memilih pilihan jawaban yang benar, THE ExplodeQuiz SHALL menambahkan 1 ke Skor.
4. WHEN semua Soal dalam Daftar_Soal telah dijawab, THE ExplodeQuiz SHALL berpindah ke Layar_Hasil secara otomatis setelah jeda singkat (maksimal 1500 milidetik) tanpa memerlukan tindakan tambahan dari Siswa.
5. WHILE Sesi_Kuis berlangsung dan masih terdapat Soal yang belum dijawab, THE ExplodeQuiz SHALL menampilkan indikator kemajuan yang menunjukkan nomor soal saat ini terhadap total soal.
6. WHILE Sesi_Kuis berlangsung dan masih terdapat Soal yang belum dijawab, THE ExplodeQuiz SHALL mencegah perpindahan manual ke Layar_Hasil.
7. THE Daftar_Soal SHALL berisi minimal 3 soal sebagai data contoh bawaan komponen.
8. THE ExplodeQuiz SHALL menerima properti `questions` bertipe Array untuk memuat Daftar_Soal kustom dari luar komponen.

---

### Requirement 4: Umpan Balik Instan

**User Story:** Sebagai Siswa, saya ingin mendapatkan umpan balik langsung setelah menjawab, agar saya tahu apakah jawaban saya benar atau salah tanpa harus menunggu.

#### Acceptance Criteria

1. WHEN Siswa memilih jawaban yang benar, THE ExplodeQuiz SHALL menampilkan Umpan_Balik berteks positif (contoh: "Mantap, Benar!") selama minimal 800 milidetik sebelum berpindah ke soal berikutnya.
2. WHEN Siswa memilih jawaban yang salah, THE ExplodeQuiz SHALL menampilkan Umpan_Balik berteks koreksi (contoh: "Yah, Salah. Jawaban benar: [pilihan benar]") selama minimal 800 milidetik sebelum berpindah ke soal berikutnya.
3. WHEN Siswa memilih jawaban yang benar, THE ExplodeQuiz SHALL mewarnai tombol pilihan yang dipilih dengan warna sukses menggunakan Token_DDD.
4. WHEN Siswa memilih jawaban yang salah, THE ExplodeQuiz SHALL mewarnai tombol pilihan yang dipilih dengan warna kesalahan menggunakan Token_DDD, sekaligus menyorot tombol jawaban yang benar dengan warna sukses.
5. THE Umpan_Balik SHALL ditampilkan di area yang jelas terlihat di bawah pilihan jawaban dengan kontras warna yang memenuhi WCAG 2.0 AA.

---

### Requirement 5: Efek Konfeti

**User Story:** Sebagai Siswa, saya ingin melihat efek konfeti yang menyenangkan saat saya menjawab dengan benar, agar pengalaman kuis terasa lebih menyenangkan dan memotivasi.

#### Acceptance Criteria

1. WHEN Siswa memilih jawaban yang benar, THE ExplodeQuiz SHALL memicu efek Konfeti menggunakan fungsi `confetti()` dari library `canvas-confetti`.
2. THE ExplodeQuiz SHALL mengimpor `canvas-confetti` dari path distribusi JavaScript yang sudah ter-compile tanpa dependensi TypeScript.
3. IF library `canvas-confetti` gagal dimuat, THEN THE ExplodeQuiz SHALL tetap berfungsi penuh sebagai kuis tanpa efek Konfeti dan mencatat peringatan ke konsol browser.
4. THE ExplodeQuiz SHALL memicu Konfeti hanya satu kali per jawaban benar (tidak berulang jika state diperbarui ulang).
5. IF fungsi `confetti()` gagal dieksekusi meskipun library berhasil dimuat, THEN THE ExplodeQuiz SHALL mencatat pesan error ke konsol browser.

---

### Requirement 6: Tampilan Skor Real-Time

**User Story:** Sebagai Siswa, saya ingin melihat skor saya diperbarui selama kuis berlangsung, agar saya dapat memantau kemajuan saya.

#### Acceptance Criteria

1. WHILE Sesi_Kuis berlangsung, THE ExplodeQuiz SHALL menampilkan Skor saat ini di area header atau progress bar yang selalu terlihat.
2. WHEN Skor bertambah, THE ExplodeQuiz SHALL memperbarui tampilan Skor secara langsung tanpa reload halaman.
3. THE ExplodeQuiz SHALL menampilkan Skor dalam format "Skor: [angka]" atau format yang setara dan mudah dibaca.

---

### Requirement 7: Layar Hasil Akhir

**User Story:** Sebagai Siswa, saya ingin melihat ringkasan hasil kuis di akhir, agar saya mengetahui total nilai saya dan mendapatkan apresiasi atas usaha saya.

#### Acceptance Criteria

1. WHEN Sesi_Kuis berakhir, THE ExplodeQuiz SHALL menampilkan Layar_Hasil yang memuat nama Siswa, Skor akhir, jumlah total Soal, dan persentase kebenaran.
2. WHEN persentase kebenaran Siswa lebih dari atau sama dengan 80 persen, THE ExplodeQuiz SHALL menampilkan pesan apresiasi tinggi (contoh: "Luar Biasa! Kamu Hebat!").
3. WHEN persentase kebenaran Siswa antara 50 persen (inklusif) dan 80 persen (eksklusif), THE ExplodeQuiz SHALL menampilkan pesan apresiasi sedang (contoh: "Bagus! Terus Berlatih!").
4. WHEN persentase kebenaran Siswa kurang dari 50 persen, THE ExplodeQuiz SHALL menampilkan pesan semangat (contoh: "Jangan Menyerah! Coba Lagi!").
5. THE Layar_Hasil SHALL menampilkan tombol "Mulai Ulang" yang mereset Sesi_Kuis dan kembali ke Layar_Nama.
6. WHEN Layar_Hasil ditampilkan dan persentase kebenaran lebih dari atau sama dengan 80 persen, THE ExplodeQuiz SHALL memicu efek Konfeti sebagai perayaan akhir kuis.

---

### Requirement 8: Integrasi Google Sheets

**User Story:** Sebagai instruktur, saya ingin data hasil kuis (nama siswa, skor, waktu) otomatis tersimpan ke Google Sheets, agar saya dapat memantau nilai seluruh siswa tanpa input manual.

#### Acceptance Criteria

1. WHEN Sesi_Kuis berakhir, THE SheetsConnector SHALL memanggil `google.script.run` untuk mengirim data hasil kuis ke Google Apps Script.
2. THE SheetsConnector SHALL mengirim data yang mencakup: Timestamp (format ISO 8601), nama Siswa, dan Skor akhir sebagai tiga argumen terpisah atau sebagai satu objek JSON.
3. IF `google.script.run` tidak tersedia (komponen dijalankan di luar lingkungan Google Apps Script), THEN THE SheetsConnector SHALL mencatat peringatan ke konsol browser dan melanjutkan ke Layar_Hasil tanpa error yang mengganggu pengguna.
4. WHEN `google.script.run` berhasil mengirim data, THE ExplodeQuiz SHALL mencatat konfirmasi pengiriman ke konsol browser.
5. IF `google.script.run` mengembalikan kegagalan, THEN THE ExplodeQuiz SHALL mencatat pesan error ke konsol browser tanpa mengganggu tampilan Layar_Hasil.
6. THE ExplodeQuiz SHALL menerima properti `scriptFunctionName` bertipe String untuk mengonfigurasi nama fungsi Apps Script yang dipanggil (nilai default: `'submitQuizResult'`).

---

### Requirement 9: Desain UI Responsif dan Aksesibel

**User Story:** Sebagai Siswa yang menggunakan ponsel, saya ingin tampilan kuis nyaman di layar kecil, agar saya dapat mengikuti kuis tanpa perlu scroll horizontal atau tombol yang terlalu kecil.

#### Acceptance Criteria

1. THE ExplodeQuiz SHALL menggunakan Token_DDD secara eksklusif untuk semua properti desain (font, warna, spasi, radius, bayangan).
2. THE ExplodeQuiz SHALL menampilkan tombol pilihan jawaban dengan ukuran sentuh minimal 44x44 piksel di perangkat dengan lebar layar kurang dari 480 piksel.
3. THE ExplodeQuiz SHALL menggunakan layout kolom tunggal untuk tombol pilihan jawaban pada perangkat dengan lebar layar kurang dari 480 piksel.
4. THE ExplodeQuiz SHALL memiliki lebar maksimum 640 piksel dan terpusat secara horizontal di layar yang lebih lebar.
5. THE ExplodeQuiz SHALL menyediakan atribut `aria-label` yang deskriptif pada semua elemen interaktif (tombol, input) untuk mendukung pembaca layar.
6. THE ExplodeQuiz SHALL menjamin rasio kontras warna antara teks dan latar belakang minimal 4.5:1 sesuai standar WCAG 2.0 AA dengan menggunakan Token_DDD yang telah diaudit.
7. THE ExplodeQuiz SHALL menunjukkan indikator fokus yang jelas pada semua elemen interaktif ketika dinavigasi menggunakan keyboard.

---

### Requirement 10: Struktur Paket dan File Komponen

**User Story:** Sebagai developer HAX, saya ingin struktur file komponen mengikuti konvensi monorepo `@haxtheweb/`, agar komponen dapat dipasang, di-build, dan diuji menggunakan toolchain standar monorepo.

#### Acceptance Criteria

1. THE ExplodeQuiz SHALL ditempatkan di direktori `elements/explode/` dengan file utama bernama `explode-quiz.js`.
2. THE ExplodeQuiz SHALL memiliki `package.json` dengan nama paket `@haxtheweb/explode`, scope `@haxtheweb/`, dan versi awal `9.0.0`.
3. THE ExplodeQuiz SHALL mendefinisikan `peerDependencies` yang mencakup `@haxtheweb/d-d-d`, `@haxtheweb/i18n-manager`, dan `lit`.
4. THE ExplodeQuiz SHALL menyertakan file `demo/index.html` yang dapat dijalankan dengan web server lokal untuk pengujian tampilan.
5. THE ExplodeQuiz SHALL menyertakan file `.dddignore` mengikuti template standar monorepo HAX.
6. THE ExplodeQuiz SHALL menyertakan file `custom-elements.json` stub yang akan di-overwrite oleh proses build.

---

### Requirement 11: Integrasi HAX Authoring

**User Story:** Sebagai developer HAX, saya ingin komponen `explode-quiz` dapat ditambahkan dan dikonfigurasi langsung dari editor HAX, agar instruktur dapat mengatur soal kuis secara visual tanpa perlu menulis kode HTML secara manual.

#### Acceptance Criteria

1. THE ExplodeQuiz SHALL mendefinisikan properti `static get haxProperties()` yang mengembalikan objek metadata lengkap sesuai spesifikasi HAX gizmo.
2. THE haxProperties SHALL mencakup properti `gizmo` dengan properti: `title` ("Interactive Quiz"), `description` ("Kuis pilihan ganda interaktif dengan feedback dan integrasi Google Sheets"), `icon` ("social:quiz"), dan `color` ("blue").
3. THE haxProperties SHALL mencakup properti `settings` dengan tab `configure` yang memungkinkan pengguna mengedit properti `questions` (array soal) dan `scriptFunctionName` (nama fungsi GAS).
4. THE haxProperties SHALL mencakup properti `settings` dengan tab `advanced` yang memungkinkan pengaturan `scriptUrl` (URL Google Apps Script deployment) jika komponen di-host di luar Google Apps Script langsung.
5. THE haxProperties SHALL mendefinisikan `canScale`, `canPosition`, dan `canEditSource` sesuai standar HAX webcomponents.
6. THE ExplodeQuiz SHALL mengekspor `haxProperties` sebagai properti statis agar dapat dibaca oleh HAX authoring saat drag-and-drop.
7. IF komponen dimuat dalam environment HAX, THEN THE ExplodeQuiz SHALL merender UI secara responsif dan menampilkan indikator "HAX mode" jika diperlukan untuk debugging.

---

### Requirement 12: Setup Integrasi Google Apps Script & Google Sheets

**User Story:** Sebagai instruktur, saya ingin panduan setup integrasi Google Apps Script dan Google Sheets yang jelas, agar saya dapat mengaktifkan fitur penyimpanan hasil kuis tanpa masalah teknis.

#### Acceptance Criteria

1. THE ExplodeQuiz SHALL menyertakan dokumentasi `README.md` yang menjelaskan langkah-langkah setup Google Apps Script dan Google Sheets.
2. THE README SHALL mencakup script Google Apps Script contoh (`Code.gs`) dengan fungsi `submitQuizResult(timestamp, name, score)` yang menulis baris baru ke spreadsheet.
3. THE README SHALL menyertakan instruksi untuk deploy Google Apps Script sebagai Web App dengan akses "Anyone" atau "Anyone with Google account" sesuai kebutuhan keamanan.
4. THE README SHALL menjelaskan cara mendapatkan URL deployment GAS dan cara mengonfigurasi properti `scriptUrl` jika komponen di-host di luar embedding langsung di Google Sites.
5. THE README SHALL menyertakan instruksi untuk membuat Google Sheet baru dan menghubungkannya dengan GAS script menggunakan `SpreadsheetApp.openById()` atau `getActiveSheet()`.
6. THE ExplodeQuiz SHALL menyediakan fallback default yang aman: jika `google.script` tidak tersedia, komponen tetap berfungsi sebagai kuis standalone tanpa error di console.
7. IF pengguna mengonfigurasi `scriptUrl` properti, THEN THE ExplodeQuiz SHALL menggunakan URL tersebut dalam `google.script.run` untuk komunikasi dengan GAS.
8. THE README SHALL mencakup contoh konfigurasi `haxProperties` agar instruktur dapat menambahkan soal kuis melalui HAX editor secara visual.

---

### Requirement 13: Pure JavaScript ES Module & Package Publishing

**User Story:** Sebagai developer HAX, saya ingin komponen `explode-quiz` dikirim sebagai pure JavaScript ES module tanpa kompilasi, dipublish di bawah scope npm `@haxtheweb/`, agar komponen dapat digunakan di berbagai environment tanpa dependensi build tool tambahan.

#### Acceptance Criteria

1. THE ExplodeQuiz SHALL dikirim sebagai single file JavaScript ES module (`explode-quiz.js`) tanpa transpilation atau bundling.
2. THE package.json SHALL menggunakan nama paket `@haxtheweb/explode` dengan scope `@haxtheweb/`.
3. THE package.json SHALL mendefinisikan `type: "module"` untuk native ES modules support.
4. THE package.json SHALL mendefinisikan `main` sebagai `explode-quiz.js` dan `module` sebagai `explode-quiz.js` agar kompatibel dengan bundler modern dan native browser.
5. THE package.json SHALL mendefinisikan `peerDependencies` dengan versi eksplisit: `@haxtheweb/d-d-d`, `@haxtheweb/i18n-manager`, dan `lit`.
6. THE package.json SHALL mendefinisikan `devDependencies` untuk build tools standar HAX: `@haxtheweb/hax-body`, `web-component-tester`, `@web/dev-server`.
7. THE package.json SHALL menyertakan skrip `build` yang menjalankan `hax-build` atau setara untuk generate `custom-elements.json`.
8. IF komponen di-load via CDN (e.g., `unpkg.com/@haxtheweb/explode`), THEN THE ExplodeQuiz SHALL merender dengan benar tanpa perlu instalasi lokal.

---

### Requirement 14: Interactive Question Editor UI

**User Story:** Sebagai instruktur, saya ingin mengedit daftar soal kuis secara langsung di dalam komponen tanpa harus menulis JSON manual, agar saya dapat membuat dan mengedit soal dengan cara yang lebih intuitif seperti pada komponen todo-list.

#### Acceptance Criteria

1. THE ExplodeQuiz SHALL menampilkan Layar_Editor (edit mode) ketika property `editing` bernilai `true`.
2. THE Layar_Editor SHALL menampilkan form untuk menambah soal baru dengan field: teks pertanyaan, 4 pilihan jawaban, dan pemilihan jawaban benar.
3. THE Layar_Editor SHALL menampilkan daftar soal yang sudah ada dalam bentuk kartu yang dapat diedit atau dihapus.
4. THE Layar_Editor SHALL menyediakan tombol "Simpan & Keluar" yang menyimpan perubahan ke properti `questions` dan keluar dari edit mode.
5. THE Layar_Editor SHALL menyediakan tombol "Batal" yang menutup edit mode tanpa menyimpan perubahan.
6. WHEN soal baru ditambahkan, THEN THE ExplodeQuiz SHALL menambahkan objek Question baru ke dalam array `questions`.
7. WHEN soal diedit, THEN THE ExplodeQuiz SHALL memperbarui objek Question yang sesuai dalam array `questions`.
8. WHEN soal dihapus, THEN THE ExplodeQuiz SHALL menghapus objek Question yang sesuai dari array `questions`.
9. IF soal yang sedang diedit tidak memiliki minimal 3 soal, THEN THE ExplodeQuiz SHALL mencegah penghapusan soal hingga jumlah soal mencapai 3.
10. THE Layar_Editor SHALL menggunakan DDD CSS custom properties untuk semua nilai desain tanpa hard-coded values.
11. THE Layar_Editor SHALL menyediakan aksesibilitas yang memenuhi WCAG 2.0 AA untuk semua elemen interaktif.
12. WHEN tombol "Simpan & Keluar" diklik, THEN THE ExplodeQuiz SHALL menutup edit mode dan merender ulang berdasarkan questions terbaru.
