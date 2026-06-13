# Bugfix Requirements Document

## Introduction

Ketika content author mengklik tombol save di HAX editor, perubahan pada komponen `<explode-quiz>` tidak tersimpan ke file HTML. Bug ini terjadi karena properti `questions` (Array) tidak di-reflect ke atribut HTML — HAX editor menyerialize komponen ke HTML dengan membaca atribut DOM, sehingga nilai `questions` yang diubah lewat HAX panel tidak pernah ditulis ke file.

Dampaknya: setiap kali halaman di-reload, komponen kembali menggunakan `DEFAULT_QUESTIONS` dan semua kustomisasi soal dari HAX hilang.

---

## Bug Analysis

### Current Behavior (Defect)

1.1 WHEN content author mengubah properti `questions` melalui HAX configure panel dan mengklik save, THEN the system tidak menyertakan atribut `questions` pada tag `<explode-quiz>` di file HTML yang tersimpan

1.2 WHEN HAX editor mencoba membaca nilai properti `questions` dari elemen DOM untuk diserialisasi ke HTML, THEN the system mengembalikan nilai `undefined` karena properti tidak reflect ke atribut

1.3 WHEN halaman yang mengandung `<explode-quiz>` di-reload setelah sesi HAX save, THEN the system mengabaikan konten yang sebelumnya dikonfigurasi dan memuat `DEFAULT_QUESTIONS`

1.4 WHEN HAX editor men-serialize `<explode-quiz>` ke HTML string, THEN the system menghasilkan tag tanpa atribut `questions`, sehingga konfigurasi soal tidak tersimpan

### Expected Behavior (Correct)

2.1 WHEN content author mengubah properti `questions` melalui HAX configure panel dan mengklik save, THEN the system SHALL menyertakan atribut `questions` berisi representasi JSON dari array soal pada tag `<explode-quiz>` di file HTML

2.2 WHEN HAX editor membaca elemen `<explode-quiz>` untuk serialisasi, THEN the system SHALL mengembalikan nilai atribut `questions` sebagai JSON string yang valid mewakili array soal saat ini

2.3 WHEN halaman di-reload setelah HAX save berhasil, THEN the system SHALL memuat soal dari atribut `questions` yang tersimpan di HTML, bukan dari `DEFAULT_QUESTIONS`

2.4 WHEN komponen `<explode-quiz>` diinisialisasi dengan atribut `questions` yang berisi JSON valid, THEN the system SHALL mem-parse nilai tersebut dan menggunakannya sebagai daftar soal aktif

### Unchanged Behavior (Regression Prevention)

3.1 WHEN komponen `<explode-quiz>` dirender tanpa atribut `questions` (tidak ada konfigurasi HAX), THEN the system SHALL CONTINUE TO menggunakan `DEFAULT_QUESTIONS` sebagai fallback

3.2 WHEN siswa menjawab soal dalam alur kuis normal (layar nama → soal → hasil), THEN the system SHALL CONTINUE TO berjalan seperti sebelumnya tanpa perubahan UX

3.3 WHEN properti `scriptFunctionName` dikonfigurasi melalui HAX, THEN the system SHALL CONTINUE TO tersimpan ke atribut HTML dan ter-restore dengan benar saat reload

3.4 WHEN content author menggunakan editor soal internal (`_openEditor`, `_saveAll`), THEN the system SHALL CONTINUE TO memperbarui properti `questions` secara lokal seperti sebelumnya

3.5 WHEN komponen dirender dalam mode non-HAX (standalone atau embed biasa), THEN the system SHALL CONTINUE TO berfungsi normal tanpa ketergantungan pada HAX

---

## Bug Condition

**Bug Condition Function:**

```pascal
FUNCTION isBugCondition(X)
  INPUT: X of type ExplodeQuizElement
  OUTPUT: boolean

  // Bug terpicu saat HAX mencoba serialize properti questions ke atribut
  RETURN X.questions IS Array
    AND X.getAttribute("questions") = null
    AND reflect IS false untuk properti questions
END FUNCTION
```

**Property: Fix Checking**

```pascal
FOR ALL X WHERE isBugCondition(X) DO
  // Setelah fix diterapkan:
  attr ← X.getAttribute("questions")
  ASSERT attr IS NOT null
  ASSERT JSON.parse(attr) deep-equals X.questions
END FOR
```

**Property: Preservation Checking**

```pascal
// F  = perilaku komponen sebelum fix (untuk input non-buggy)
// F' = perilaku komponen setelah fix

FOR ALL X WHERE NOT isBugCondition(X) DO
  // X adalah komponen tanpa atribut questions (pakai default)
  ASSERT F(X).questionsUsed = DEFAULT_QUESTIONS
  ASSERT F'(X).questionsUsed = DEFAULT_QUESTIONS
  ASSERT F(X) = F'(X)  // tidak ada perubahan perilaku
END FOR
```
