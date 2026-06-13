# Design Document: todo-list

## Overview

`<todo-list>` adalah LitElement web component yang diintegrasikan ke dalam monorepo HAX Webcomponents. Komponen ini memungkinkan pengguna mengelola daftar tugas sederhana (tambah, hapus, tandai selesai) dalam satu file komponen tunggal tanpa sub-komponen eksternal. State disimpan sepenuhnya di memori menggunakan reaktivitas LitElement.

---

## Architecture

Komponen mengikuti pola standar HAX monorepo: satu file JS utama, mixin chain `I18NMixin(DDDSuper(LitElement))`, DDD tokens untuk semua nilai visual, dan `haxProperties` untuk integrasi HAX editor.

```
elements/todo-list/
├── todo-list.js        # komponen utama (satu file)
├── demo/
│   └── index.html      # halaman demo lokal
├── test/
│   └── todo-list.test.js
├── package.json
├── custom-elements.json  # AUTO-GENERATED
└── .dddignore
```

### Dependency Graph

```
todo-list.js
  └── I18NMixin        (@haxtheweb/i18n-manager/lib/I18NMixin.js)
      └── DDDSuper     (@haxtheweb/d-d-d/d-d-d.js)
          └── LitElement (lit)
```

Tidak ada sub-komponen eksternal. Semua logika rendering task list berada dalam satu kelas `TodoList`.

---

## Components and Interfaces

### Tag

```html
<todo-list></todo-list>
```

### Reactive Properties

| Properti | Tipe    | Default | Deskripsi                               |
|----------|---------|---------|-----------------------------------------|
| `tasks`  | `Array` | `[]`    | Array of Task objects yang dirender     |

> **Catatan:** `tasks` tidak di-reflect ke attribute karena array tidak cocok sebagai attribute HTML.

### Task Object Schema

```js
{
  id: String,        // UUID v4 — dihasilkan via crypto.randomUUID()
  text: String,      // teks deskripsi tugas (tidak kosong)
  completed: Boolean // false = belum selesai, true = selesai
}
```

---

## Data Models

### Task

Satu-satunya data model dalam komponen ini adalah objek `Task` yang disimpan dalam array reaktif `tasks`:

```js
/**
 * @typedef {Object} Task
 * @property {string}  id        - Unique identifier (crypto.randomUUID())
 * @property {string}  text      - Deskripsi tugas, selalu non-empty setelah trim
 * @property {boolean} completed - true jika tugas sudah selesai, false jika belum
 */
```

**Invariants:**
- `id` selalu unik antar task dalam satu instance komponen
- `text` selalu non-empty (whitespace-only tidak pernah tersimpan)
- `completed` hanya bernilai `true` atau `false` (tidak pernah undefined/null)
- Urutan array mencerminkan urutan penambahan (FIFO)

**State Lifecycle:**
```
Komponen baru → tasks = []
Tambah task   → tasks = [...tasks, newTask]
Hapus task    → tasks = tasks.filter(t => t.id !== id)
Toggle task   → tasks = tasks.map(t => t.id === id ? {...t, completed: v} : t)
Unmount/refresh → state hilang (tidak ada persistensi)
```

### Internal State (tidak reaktif)

`this._inputValue` dikelola langsung dari elemen DOM `<input>` via event handler — tidak perlu reactive property terpisah karena tidak mempengaruhi keputusan rendering yang bergantung pada nilai ini.

---

## Component Implementation

### File: `elements/todo-list/todo-list.js`

```js
import { DDDSuper } from '@haxtheweb/d-d-d/d-d-d.js'
import { LitElement, html, css } from 'lit'
import { I18NMixin } from '@haxtheweb/i18n-manager/lib/I18NMixin.js'

class TodoList extends I18NMixin(DDDSuper(LitElement)) {

  static get tag() {
    return 'todo-list'
  }

  static get properties() {
    return {
      ...super.properties,
      tasks: { type: Array },
    }
  }

  constructor() {
    super()
    this.tasks = []
    this.t = {
      addTask: 'Add Task',
      inputPlaceholder: 'Enter a new task...',
      deleteTask: 'Delete task',
      emptyMessage: 'No tasks yet. Add one above!',
      taskCompleted: 'Mark as incomplete',
      taskIncomplete: 'Mark as complete',
    }
  }

  static get styles() {
    return [
      super.styles,
      css`
        :host {
          display: block;
          font-family: var(--ddd-font-primary);
          padding: var(--ddd-spacing-6);
          background: var(--ddd-theme-background);
          color: var(--ddd-theme-primary);
          max-width: 600px;
        }

        .input-area {
          display: flex;
          gap: var(--ddd-spacing-3);
          margin-bottom: var(--ddd-spacing-5);
        }

        .task-input {
          flex: 1;
          padding: var(--ddd-spacing-3) var(--ddd-spacing-4);
          font-family: var(--ddd-font-primary);
          font-size: var(--ddd-font-size-s);
          border: var(--ddd-border-sm) solid var(--ddd-theme-accent);
          border-radius: var(--ddd-radius-sm);
          background: var(--ddd-theme-background);
          color: var(--ddd-theme-primary);
          outline: none;
        }

        .task-input:focus {
          border-color: var(--ddd-theme-link);
          box-shadow: 0 0 0 var(--ddd-spacing-1) var(--ddd-theme-link-light);
        }

        .add-button {
          padding: var(--ddd-spacing-3) var(--ddd-spacing-5);
          font-family: var(--ddd-font-primary);
          font-size: var(--ddd-font-size-s);
          background: var(--ddd-theme-accent);
          color: var(--ddd-theme-background);
          border: none;
          border-radius: var(--ddd-radius-sm);
          cursor: pointer;
        }

        .add-button:hover {
          background: var(--ddd-theme-link);
        }

        .add-button:focus-visible {
          outline: var(--ddd-spacing-1) solid var(--ddd-theme-link);
          outline-offset: var(--ddd-spacing-1);
        }

        .task-list {
          list-style: none;
          padding: 0;
          margin: 0;
        }

        .task-item {
          display: flex;
          align-items: center;
          gap: var(--ddd-spacing-3);
          padding: var(--ddd-spacing-3) var(--ddd-spacing-4);
          margin-bottom: var(--ddd-spacing-2);
          background: var(--ddd-theme-background-secondary);
          border-radius: var(--ddd-radius-sm);
          border-left: var(--ddd-spacing-1) solid var(--ddd-theme-accent);
        }

        .task-checkbox {
          width: var(--ddd-spacing-5);
          height: var(--ddd-spacing-5);
          cursor: pointer;
          accent-color: var(--ddd-theme-accent);
          flex-shrink: 0;
        }

        .task-checkbox:focus-visible {
          outline: var(--ddd-spacing-1) solid var(--ddd-theme-link);
          outline-offset: var(--ddd-spacing-1);
        }

        .task-text {
          flex: 1;
          font-family: var(--ddd-font-primary);
          font-size: var(--ddd-font-size-s);
          color: var(--ddd-theme-primary);
        }

        .task-text.completed {
          text-decoration: line-through;
          color: var(--ddd-theme-disabled);
          opacity: var(--ddd-opacity-50);
        }

        .delete-button {
          padding: var(--ddd-spacing-1) var(--ddd-spacing-3);
          font-family: var(--ddd-font-primary);
          font-size: var(--ddd-font-size-xs);
          background: transparent;
          color: var(--ddd-theme-error);
          border: var(--ddd-border-sm) solid var(--ddd-theme-error);
          border-radius: var(--ddd-radius-sm);
          cursor: pointer;
          flex-shrink: 0;
        }

        .delete-button:hover {
          background: var(--ddd-theme-error);
          color: var(--ddd-theme-background);
        }

        .delete-button:focus-visible {
          outline: var(--ddd-spacing-1) solid var(--ddd-theme-error);
          outline-offset: var(--ddd-spacing-1);
        }

        .empty-message {
          text-align: center;
          padding: var(--ddd-spacing-8);
          color: var(--ddd-theme-disabled);
          font-family: var(--ddd-font-primary);
          font-size: var(--ddd-font-size-s);
          font-style: italic;
        }
      `,
    ]
  }

  // ── Render ────────────────────────────────────────────────────────────────

  render() {
    return html`
      <div class="input-area">
        <label for="task-input" class="sr-only">${this.t.addTask}</label>
        <input
          id="task-input"
          class="task-input"
          type="text"
          placeholder="${this.t.inputPlaceholder}"
          aria-label="${this.t.addTask}"
          @keydown="${this._handleInputKeydown}"
        />
        <button
          class="add-button"
          aria-label="${this.t.addTask}"
          @click="${this._handleAddClick}"
        >
          ${this.t.addTask}
        </button>
      </div>

      ${this.tasks.length === 0
        ? html`<p class="empty-message">${this.t.emptyMessage}</p>`
        : html`
            <ul class="task-list" aria-label="Task list">
              ${this.tasks.map((task) => this._renderTask(task))}
            </ul>
          `}
    `
  }

  _renderTask(task) {
    return html`
      <li class="task-item" data-id="${task.id}">
        <input
          type="checkbox"
          class="task-checkbox"
          .checked="${task.completed}"
          aria-label="${task.completed ? this.t.taskCompleted : this.t.taskIncomplete}"
          aria-checked="${task.completed}"
          @change="${(e) => this._handleToggleComplete(task.id, e.target.checked)}"
        />
        <span class="task-text ${task.completed ? 'completed' : ''}">${task.text}</span>
        <button
          class="delete-button"
          aria-label="${this.t.deleteTask}: ${task.text}"
          @click="${() => this._handleDelete(task.id)}"
        >
          ${this.t.deleteTask}
        </button>
      </li>
    `
  }

  // ── Event Handlers ────────────────────────────────────────────────────────

  _handleInputKeydown(e) {
    if (e.key === 'Enter') {
      this._addTask()
    }
  }

  _handleAddClick() {
    this._addTask()
  }

  _handleDelete(id) {
    this.tasks = this.tasks.filter((task) => task.id !== id)
  }

  _handleToggleComplete(id, checked) {
    this.tasks = this.tasks.map((task) =>
      task.id === id ? { ...task, completed: checked } : task
    )
  }

  // ── Business Logic ────────────────────────────────────────────────────────

  _addTask() {
    const input = this.shadowRoot.querySelector('#task-input')
    const text = input.value.trim()
    if (!text) return
    const newTask = {
      id: crypto.randomUUID(),
      text,
      completed: false,
    }
    this.tasks = [...this.tasks, newTask]
    input.value = ''
    input.focus()
  }

  // ── HAX Properties ────────────────────────────────────────────────────────

  static get haxProperties() {
    return {
      canScale: false,
      canPosition: false,
      canEditSource: false,
      gizmo: {
        title: 'Todo List',
        description: 'A simple task management web component',
        icon: 'icons:assignment',
        color: 'blue',
        tags: ['Productivity', 'Content'],
      },
      settings: {
        configure: [],
        advanced: [],
      },
    }
  }
}

globalThis.customElements.define(TodoList.tag, TodoList)
```

---

## Data Flow

### Tambah Tugas

```
User ketik teks → tekan Enter / klik Add Button
  → _handleInputKeydown / _handleAddClick
    → _addTask()
      → trim input value
      → guard: jika kosong/whitespace → return (tidak ada perubahan)
      → buat Task object: { id: crypto.randomUUID(), text, completed: false }
      → this.tasks = [...this.tasks, newTask]  (immutable update)
      → LitElement reaktivitas → render ulang
      → input.value = ''
      → input.focus()
```

### Hapus Tugas

```
User klik Delete Button pada task X
  → _handleDelete(id)
    → this.tasks = this.tasks.filter(task => task.id !== id)
    → LitElement reaktivitas → render ulang tanpa task X
```

### Toggle Selesai

```
User klik checkbox pada task X
  → _handleToggleComplete(id, checked)
    → this.tasks = this.tasks.map(task =>
        task.id === id ? { ...task, completed: checked } : task
      )
    → LitElement reaktivitas → render ulang dengan task X.completed = checked
```

---

## Internasionalisasi (i18n)

Semua string UI disimpan dalam `this.t` di constructor mengikuti pola `I18NMixin`. Nilai default berbahasa Inggris disediakan.

| Key                | Default (EN)                    | Digunakan di                      |
|--------------------|---------------------------------|-----------------------------------|
| `addTask`          | `'Add Task'`                    | Add Button label, input aria-label |
| `inputPlaceholder` | `'Enter a new task...'`         | Input placeholder                  |
| `deleteTask`       | `'Delete task'`                 | Delete Button label                |
| `emptyMessage`     | `'No tasks yet. Add one above!'`| Pesan daftar kosong                |
| `taskCompleted`    | `'Mark as incomplete'`          | Checkbox aria-label saat selesai   |
| `taskIncomplete`   | `'Mark as complete'`            | Checkbox aria-label saat belum     |

---

## Accessibility

| Elemen              | Atribut Aksesibilitas                                         |
|---------------------|---------------------------------------------------------------|
| Input Field         | `aria-label` + `<label class="sr-only">` terhubung via `for`/`id` |
| Add Button          | `aria-label="${this.t.addTask}"`                              |
| Task Checkbox       | `type="checkbox"`, `aria-checked`, `aria-label` dinamis      |
| Delete Button       | `aria-label="${this.t.deleteTask}: ${task.text}"` (kontekstual) |
| Task List           | `<ul aria-label="Task list">`                                 |

Semua elemen interaktif memiliki `:focus-visible` style menggunakan DDD tokens (`--ddd-theme-link`, `--ddd-spacing-1`) agar indikator fokus keyboard selalu terlihat.

---

## DDD Design Token Usage

| Kategori  | Token yang digunakan                                                                                  |
|-----------|-------------------------------------------------------------------------------------------------------|
| Font      | `--ddd-font-primary`, `--ddd-font-size-s`, `--ddd-font-size-xs`                                      |
| Spacing   | `--ddd-spacing-1` hingga `--ddd-spacing-8`                                                           |
| Warna     | `--ddd-theme-primary`, `--ddd-theme-accent`, `--ddd-theme-background`, `--ddd-theme-background-secondary`, `--ddd-theme-link`, `--ddd-theme-link-light`, `--ddd-theme-error`, `--ddd-theme-disabled` |
| Border    | `--ddd-border-sm`, `--ddd-radius-sm`                                                                 |
| Opacity   | `--ddd-opacity-50`                                                                                    |

Tidak ada nilai hardcoded. Semua nilai visual berasal dari DDD tokens.

---

## Error Handling

| Kondisi                                    | Penanganan                                                      |
|--------------------------------------------|-----------------------------------------------------------------|
| Input kosong atau whitespace saja           | `_addTask()` memeriksa `text.trim()` dan return early — tidak ada task dibuat |
| `crypto.randomUUID()` tidak tersedia        | Fallback: `Math.random().toString(36).slice(2)` + timestamp — semua browser modern mendukung `crypto.randomUUID()` |
| Task dengan id tidak ditemukan saat delete  | `Array.filter` tidak melempar error — daftar tetap tidak berubah |
| Task dengan id tidak ditemukan saat toggle  | `Array.map` mengembalikan array sama — tidak ada efek samping    |

---

## Testing Strategy

### Pendekatan Dual Testing

Komponen ini menggunakan dua lapisan pengujian yang saling melengkapi:

**Unit / Example Tests** — untuk kondisi spesifik dan edge cases:
- Verifikasi `tasks` diinisialisasi sebagai `[]` di constructor
- Verifikasi elemen `<input>` dan `<button>` Add ada di shadowRoot
- Verifikasi pesan kosong muncul saat `tasks = []`
- Verifikasi Complete Toggle adalah `input[type=checkbox]`
- Verifikasi Input Field memiliki `aria-label` atau `<label>` terhubung
- Verifikasi `this.t` mendefinisikan semua key i18n yang diperlukan

**Property-Based Tests** — untuk perilaku universal:
- Setiap property dalam section "Correctness Properties" di bawah diterjemahkan ke test property-based
- Library yang direkomendasikan: `fast-check` (JavaScript, browser-compatible)
- Minimum 100 iterasi per property test

### Konfigurasi Test

```js
// test/todo-list.test.js
import { fixture, html, expect } from '@open-wc/testing'
import fc from 'fast-check'
import '../todo-list.js'

// Konfigurasi fast-check
const FC_RUNS = 100
```

### Generator Strategi

| Input                | Generator fast-check                                    |
|----------------------|---------------------------------------------------------|
| Teks task valid      | `fc.string({ minLength: 1 }).filter(s => s.trim() !== '')` |
| Whitespace string    | `fc.stringOf(fc.constantFrom(' ', '\t', '\n'))`         |
| Array tasks awal     | `fc.array(validTaskArbitrary, { maxLength: 20 })`       |
| Task dari daftar     | `fc.integer({ min: 0, max: tasks.length - 1 })`         |

---

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system — essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: Task Object Schema Invariant

*For any* teks task non-kosong yang ditambahkan ke TodoList, objek Task yang dihasilkan dan disimpan dalam array `tasks` harus memiliki properti `id` bertipe string (non-empty), `text` bertipe string yang sama dengan input yang di-trim, dan `completed` bernilai `false`.

**Validates: Requirements 2.4, 3.2**

---

### Property 2: Whitespace Input Rejection

*For any* string yang terdiri sepenuhnya dari karakter whitespace (spasi, tab, newline, atau kombinasinya), mencoba menambahkan string tersebut sebagai task tidak boleh mengubah panjang atau isi array `tasks`.

**Validates: Requirements 3.5**

---

### Property 3: Task Addition Increases List Length

*For any* array `tasks` awal dengan panjang N dan string input tidak kosong yang valid, setelah memanggil `_addTask()`, panjang array `tasks` harus menjadi N + 1 dan task terakhir harus memiliki text yang sesuai dengan input.

**Validates: Requirements 3.2, 6.1, 6.3**

---

### Property 4: Input Cleared After Addition

*For any* string input yang valid (non-whitespace), setelah penambahan task berhasil, nilai elemen `<input>` harus menjadi string kosong `''`.

**Validates: Requirements 3.3**

---

### Property 5: Task Deletion Removes Exactly One Task

*For any* array `tasks` dengan panjang N dan sembarang task dalam array tersebut, menghapus task tersebut berdasarkan `id`-nya harus menghasilkan array `tasks` baru dengan panjang N - 1, dan tidak ada elemen dalam array baru yang memiliki `id` yang sama dengan task yang dihapus.

**Validates: Requirements 4.2**

---

### Property 6: Complete Toggle Round-Trip

*For any* task dalam daftar, mengaktifkan Complete Toggle (completed: false → true) lalu menonaktifkannya kembali (completed: true → false) harus mengembalikan nilai `completed` task tersebut ke nilai awalnya (`false`). Secara lebih umum: nilai `completed` harus selalu mencerminkan state terakhir yang di-set oleh pengguna.

**Validates: Requirements 5.2, 5.3**

---

### Property 7: Render Count Matches Tasks Length

*For any* array `tasks` dengan panjang N, jumlah elemen `<li>` yang dirender dalam `<ul class="task-list">` harus tepat sama dengan N.

**Validates: Requirements 6.1**

---

### Property 8: Per-Task Elements Invariant

*For any* task dalam array `tasks`, elemen list item yang dirender untuk task tersebut harus mengandung tepat satu `<input type="checkbox">` (Complete Toggle), satu elemen teks dengan class `task-text`, dan satu `<button class="delete-button">` dengan atribut `aria-label` yang tidak kosong.

**Validates: Requirements 4.1, 5.1, 9.1**

---

### Property 9: Completed Task Visual Differentiation

*For any* task dengan `completed = true`, elemen `<span class="task-text">` yang dirender untuk task tersebut harus memiliki class `completed`. Sebaliknya, *for any* task dengan `completed = false`, elemen tersebut tidak boleh memiliki class `completed`.

**Validates: Requirements 5.4**

---

### Property 10: Rendering Order Preserves Insertion Order

*For any* urutan penambahan tasks T1, T2, ..., TN, urutan elemen yang dirender dalam task list harus sama dengan urutan penambahan — T1 dirender pertama, TN dirender terakhir.

**Validates: Requirements 6.3**
