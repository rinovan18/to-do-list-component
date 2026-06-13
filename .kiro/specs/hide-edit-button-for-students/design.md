# Design Document

## Feature: hide-edit-button-for-students

---

## Overview

This feature adds an `editable` Boolean property (default `false`, `reflect: true`) to the `<explode-quiz>` LitElement component. The property gates whether the "Edit Soal Kuis" button (`edit-questions-btn`) appears in the DOM at all on the name screen and result screen.

The key design decision is **conditional rendering** — when `editable === false`, the button is completely absent from the shadow DOM and accessibility tree. This is preferable to CSS-based hiding (`display: none`, `visibility: hidden`) because absent DOM nodes cannot receive keyboard focus or be discovered by screen readers.

The change is fully backward compatible: any existing `<explode-quiz>` deployment without the `editable` attribute will default to `false`, so students continue to see no edit button without any configuration changes.

---

## Architecture

The feature is a **single-file, single-component change** confined to `elements/explode/explode-quiz.js`. No new files, no new dependencies, no changes to the build pipeline.

```
<explode-quiz editable>          ← instructor view (editable=true)
  shadow-root
    ├── _renderNameScreen()
    │     ├── … quiz UI …
    │     └── <button class="edit-questions-btn">   ← rendered only when editable=true
    └── _renderResultScreen()
          ├── … result UI …
          └── <button class="edit-questions-btn">   ← rendered only when editable=true

<explode-quiz>                   ← student view (editable=false, default)
  shadow-root
    ├── _renderNameScreen()
    │     └── … quiz UI … (no edit button in DOM)
    └── _renderResultScreen()
          └── … result UI … (no edit button in DOM)
```

LitElement's reactive property system handles re-rendering automatically: when `editable` changes at runtime, the component re-renders within the current LitElement update cycle — no page reload required.

---

## Components and Interfaces

### Modified: `ExplodeQuiz` class

**New reactive property**

```js
static get properties() {
  return {
    ...super.properties,
    // --- existing properties ---
    editable: { type: Boolean, attribute: true, reflect: true },
    // --- existing properties continue ---
  }
}
```

`reflect: true` keeps the HTML attribute and JS property in sync. When HAX sets `el.editable = true`, the attribute `editable` appears on the element. When the attribute is removed, `el.editable` becomes `false`.

**Constructor default**

```js
constructor() {
  super()
  this.editable = false   // student-mode by default
  // … rest of existing constructor …
}
```

**Conditional rendering in `_renderNameScreen()`**

Replace the unconditional edit button with a conditional template expression:

```js
_renderNameScreen() {
  return html`
    …
    ${this.editable
      ? html`<button
          class="edit-questions-btn"
          @click="${this._openEditorFromName}"
          aria-label="${this.t.ariaCloseEditor}"
        >${this.t.editTitle}</button>`
      : ''}
  `
}
```

**Conditional rendering in `_renderResultScreen()`**

```js
_renderResultScreen() {
  return html`
    …
    ${this.editable
      ? html`<button
          class="edit-questions-btn"
          @click="${this._openEditor}"
          aria-label="${this.t.ariaCloseEditor}"
        >${this.t.editTitle}</button>`
      : ''}
  `
}
```

**HAX properties registration**

Add one entry to `settings.configure`:

```js
static get haxProperties() {
  return {
    …
    settings: {
      configure: [
        // … existing entries …
        {
          property: 'editable',
          title: 'Mode Edit (Instruktur)',
          description: 'Aktifkan untuk menampilkan tombol edit soal kuis',
          inputMethod: 'boolean',
        },
      ],
      advanced: [],
    },
  }
}
```

### No changes to

- `_renderEditorScreen()` — the editor screen itself is unchanged; it only becomes reachable when `editable === true`
- `_openEditor()` / `_openEditorFromName()` — these methods remain as-is; the buttons that call them are simply not rendered when `editable === false`
- All quiz-flow methods (`_startQuiz`, `_selectAnswer`, `_advanceQuiz`, `_restartQuiz`, `_submitToSheets`) — untouched
- CSS styles — no new rules needed; the button already has `.edit-questions-btn` styles; they remain in place for when the button is rendered

---

## Data Models

No new data structures. The only change is one new Boolean property on the existing component.

| Property | Type | Default | Reflect | Purpose |
|---|---|---|---|---|
| `editable` | `Boolean` | `false` | `true` | Controls visibility of `edit-questions-btn` in name and result screens |

**Boolean attribute semantics** follow standard HTML conventions:
- `<explode-quiz>` → `editable === false` (attribute absent)
- `<explode-quiz editable>` → `editable === true` (attribute present, no value)
- `<explode-quiz editable="">` → `editable === true` (attribute present, empty string — per LitElement Boolean type handling)
- `<explode-quiz editable="false">` → `editable === true` per HTML spec (any non-null attribute string is truthy for `type: Boolean` in LitElement); this is standard LitElement behavior and does **not** need special handling

---

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system — essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

This feature has clear universal properties: the relationship between `editable` and button DOM presence is an invariant that must hold for all possible component states (any `_screen` value, any `questions` array, any `_studentName`, any `_score`). Property-based testing with fast-check is appropriate here.

---

### Property 1: Edit button absent from DOM when editable is false

*For any* component state (arbitrary questions, student name, and score) where `editable === false`, the `.edit-questions-btn` element SHALL NOT exist anywhere in the shadow DOM on the name screen or result screen.

**Validates: Requirements 1.3, 1.6, 2.1, 3.1, 5.1, 6.1, 6.2**

---

### Property 2: Edit button present in DOM with aria-label when editable is true

*For any* component state (arbitrary questions, student name, and score) where `editable === true`, the `.edit-questions-btn` element SHALL exist in the shadow DOM on the name screen and result screen, and each rendered button SHALL have a non-empty `aria-label` attribute.

**Validates: Requirements 1.4, 1.7, 2.2, 3.2, 6.3**

---

### Property 3: Clicking edit button navigates to editor screen

*For any* `editable === true` component on the name screen or result screen, clicking the `.edit-questions-btn` button SHALL change `_screen` to `'editor'`.

**Validates: Requirements 2.3, 3.3**

---

### Property 4: editable and editing are independent properties

*For any* combination of `editable` (true or false) and `editing` (true or false) values, setting one SHALL NOT change the other. The two properties are orthogonal and must not interfere.

**Validates: Requirements 1.5**

---

## Error Handling

This feature introduces no new error conditions. The change is purely additive.

**Edge case — boolean attribute with string value `"false"`**: LitElement's `type: Boolean` converter treats *any non-null attribute* as `true`. Setting `editable="false"` in HTML will therefore result in `editable === true`. This is standard LitElement/HTML boolean attribute behavior. Documentation should note that to disable the button, the attribute must be *absent*, not set to `"false"`.

**Guard against editor access when `editable === false`**: The existing `_openEditor()` and `_openEditorFromName()` methods include guards (`if (this._screen !== ...) return`). Since the buttons that call these methods will not be rendered when `editable === false`, there is no direct user path to the editor. The existing method guards remain as a defense-in-depth measure and require no changes.

---

## Testing Strategy

The test stack is already established in `elements/explode/test/explode-quiz.test.js`:
- **Test runner**: `@web/test-runner` (WTR)
- **Assertion library**: `@open-wc/testing` (Chai + DOM helpers)
- **Property-based testing**: `fast-check` v4

Run tests with:
```bash
cd elements/explode
npm test
```

### Unit / Example-based tests

| Test | What it verifies |
|---|---|
| `editable` defaults to `false` on new instance | Req 1.2 |
| `editing` defaults to `false` on new instance (non-regression) | Req 5.3 |
| `haxProperties.settings.configure` contains `editable` entry with `inputMethod: 'boolean'` | Req 4.1, 4.2 |
| Setting `editable=false` → `true` on name screen shows button after `updateComplete` | Req 2.4 |
| Setting `editable=true` → `false` on name screen hides button after `updateComplete` | Req 2.5 |
| Setting `editable=false` → `true` on result screen shows button after `updateComplete` | Req 3.4 |
| Setting `editable=true` → `false` on result screen hides button after `updateComplete` | Req 3.5 |
| Button absent from DOM means `querySelectorAll` returns empty NodeList (not hidden via CSS) | Req 6.4 |

### Property-based tests (fast-check, minimum 100 iterations each)

Each test uses `fc.assert` with `numRuns: 100`.

**Property 1 test** — `editable=false` → button absent  
Tag: `Feature: hide-edit-button-for-students, Property 1: Edit button absent from DOM when editable is false`
```
Generate: arbitrary valid questions array, arbitrary student name (minLength: 1), arbitrary score (integer ≥ 0)
For each: render component without editable attribute, set _screen to 'name', assert shadowRoot.querySelector('.edit-questions-btn') is null
Repeat: set _screen to 'result', same assertion
```

**Property 2 test** — `editable=true` → button present with aria-label  
Tag: `Feature: hide-edit-button-for-students, Property 2: Edit button present in DOM with aria-label when editable is true`
```
Generate: arbitrary valid questions array, arbitrary student name (minLength: 1), arbitrary score (integer ≥ 0)
For each: render component with editable attribute, set _screen to 'name', assert button exists AND has non-empty aria-label
Repeat: set _screen to 'result', same assertions
```

**Property 3 test** — click button → navigate to editor  
Tag: `Feature: hide-edit-button-for-students, Property 3: Clicking edit button navigates to editor screen`
```
Generate: arbitrary valid questions array (minLength: 3)
For each: render with editable=true on name screen, click .edit-questions-btn, assert _screen === 'editor'
Reset component, set to result screen, click .edit-questions-btn, assert _screen === 'editor'
```

**Property 4 test** — editable and editing are independent  
Tag: `Feature: hide-edit-button-for-students, Property 4: editable and editing are independent properties`
```
Generate: fc.boolean() for initial editable, fc.boolean() for initial editing, fc.boolean() for new editable value
For each: set both, then change editable, assert editing is unchanged
Reverse: set both, then change editing, assert editable is unchanged
```

### Regression

All existing 14 property tests and unit tests in `explode-quiz.test.js` must continue to pass without modification. The new `editable` property does not affect quiz flow, scoring, feedback, confetti, sheets integration, or the editor itself.

### Pre-PR checklist

```bash
cd elements/explode
npm test          # all tests pass
npm run lint      # no ESLint errors
hax audit         # DDD compliance
yarn run build    # custom-elements.json regenerated
```
