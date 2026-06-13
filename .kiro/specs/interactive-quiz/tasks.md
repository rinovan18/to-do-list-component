# Implementation Plan: `explode-quiz` (interactive-quiz)

## Overview

Implementasi komponen `<explode-quiz>` sebagai LitElement tunggal dalam monorepo HAX webcomponents.
Komponen dibangun layer by layer: scaffolding paket → skeleton komponen → tiga layar state machine
(Layar_Nama, Layar_Soal, Layar_Hasil) → integrasi konfeti dan Google Sheets → demo page → tests.

## Tasks

- [x] 1. Scaffold package structure `elements/explode/`
  - Create `elements/explode/package.json` with name `@haxtheweb/explode`, version `9.0.0`, scripts (`start`, `build`, `dev`, `test`, `lint`, `lint:fix`, `format`), peerDependencies (`@haxtheweb/d-d-d`, `@haxtheweb/i18n-manager`, `lit`), dependency `canvas-confetti@^1.9.3`, and devDependencies (`@open-wc/testing@^3.2.0`, `@web/test-runner@^0.18.0`, `fast-check@^4.8.0`, `@custom-elements-manifest/analyzer@^0.6.9`, `@web/dev-server@^0.4.0`, `eslint@^8.0.0`, `prettier@^3.0.0`)
  - Create `elements/explode/.dddignore` following the standard monorepo HAX template (exclude node_modules, dist, build, test, .github, .vscode, *.md, *.yml, *.json, *.png, *.svg)
  - Create `elements/explode/custom-elements.json` stub (`{}`) that will be overwritten by the build process
  - **Requirement:** 10.1, 10.2, 10.3, 10.5, 10.6

- [x] 2. Create `explode-quiz.js` — component skeleton with static metadata
  - Implement `ExplodeQuiz` class extending `I18NMixin(DDDSuper(LitElement))`
  - Add `static get tag()` returning `'explode-quiz'`
  - Add `static get haxProperties()` with full gizmo metadata (title: 'Explode Quiz', icon: 'icons:question-answer', color: 'purple', tags: ['Education', 'Interactive', 'Content']) and settings for `questions` (code-editor) and `scriptFunctionName` (textfield)
  - Define public properties: `questions` (Array, default `DEFAULT_QUESTIONS`) and `scriptFunctionName` (String, default `'submitQuizResult'`)
  - Define all internal reactive state properties with `state: true`: `_screen`, `_studentName`, `_currentIndex`, `_score`, `_answered`, `_selectedIndex`, `_feedbackText`, `_feedbackPositive`, `_validationError`, `_nameInputValue`
  - Initialize all i18n strings in `constructor()` via `this.t = { ... }` covering all keys from the design (quizTitle, quizInstruction, namePlaceholder, startButton, validationNameEmpty, validationNameShort, questionOf, of, scoreLabel, feedbackCorrect, feedbackWrongPrefix, resultHeading, resultName, resultScore, resultTotal, resultPercentage, messageHigh, messageMedium, messageLow, restartButton, ariaNameInput, ariaStartButton, ariaAnswerButton, ariaRestartButton, ariaScoreDisplay, ariaProgressLabel, ariaFeedback)
  - Define `DEFAULT_QUESTIONS` const (3 built-in questions) and guard: fallback to `DEFAULT_QUESTIONS` if `questions` prop is an empty array
  - Register custom element: `globalThis.customElements.define(ExplodeQuiz.tag, ExplodeQuiz)`
  - **Requirement:** 1.1, 1.2, 1.3, 1.4, 3.7, 3.8, 8.6

- [x] 3. Implement `connectedCallback` with dynamic canvas-confetti import
  - Override `connectedCallback()`, call `super.connectedCallback()`
  - Dynamic import `canvas-confetti/dist/confetti.module.mjs` inside a try/catch
  - On success: assign `mod.default` to `this._confettiFn`
  - On failure: `console.warn('[explode-quiz] canvas-confetti gagal dimuat — efek konfeti dinonaktifkan:', err)`, set `this._confettiFn = null`
  - **Requirement:** 1.5, 5.2, 5.3

- [x] 4. Implement `_fireConfetti()` method
  - Guard: `if (typeof this._confettiFn !== 'function') return`
  - Call `this._confettiFn({ particleCount: 120, spread: 70, origin: { y: 0.6 } })` inside try/catch
  - On catch: `console.error('[explode-quiz] Konfeti gagal dieksekusi:', err)`
  - **Requirement:** 5.1, 5.4, 5.5

- [x] 5. Implement Layar_Nama render branch and `_startQuiz()` logic
  - Add `_renderNameScreen()` method returning the Layar_Nama template with: `.quiz-title`, `.quiz-instruction`, `input#name-input` (bound to `_nameInputValue`, `aria-label`, `@keydown` Enter handler, placeholder), `button.start-btn` (`aria-label`, `@click`), and conditional `p.validation-error`
  - Implement `_startQuiz()`: trim `_nameInputValue`; if trimmed length ≤ 2 set `_validationError` and return; else set `_studentName = trimmed`, clear `_validationError`, set `_screen = 'question'`
  - **Requirement:** 2.1, 2.2, 2.3, 2.4, 2.5, 2.6

- [x] 6. Implement Layar_Soal render branch
  - Add `_renderQuestionScreen()` returning the Layar_Soal template:
    - `header.quiz-header` with `.progress-label` ("Soal {N} dari {M}", aria-label) and `.score-display` ("Skor: {X}", aria-label)
    - `.question-text` with current question text
    - `.answer-grid` with 4 `button.answer-btn` elements each having `?disabled="${_answered}"`, dynamic CSS class (`answer-btn--correct` / `answer-btn--wrong`) based on post-answer state, descriptive `aria-label`, and `@click` handler
    - Conditional `.feedback-area` with `aria-live="polite"` and `aria-label` shown when `_feedbackText` is non-empty
  - **Requirement:** 3.1, 3.2, 3.5, 3.6, 4.3, 4.4, 4.5, 6.1, 6.2, 6.3, 9.5, 9.7

- [x] 7. Implement `_selectAnswer(choiceIndex)` and `_advanceQuiz()` methods
  - `_selectAnswer(choiceIndex)`: guard `if (this._answered) return`; set `_answered = true`, `_selectedIndex = choiceIndex`; evaluate correctness; if correct: increment `_score`, set positive feedback text, `_feedbackPositive = true`, call `_fireConfetti()`; if wrong: set corrective feedback text with correct choice appended, `_feedbackPositive = false`; schedule `_advanceQuiz()` via `setTimeout(1200)`
  - `_advanceQuiz()`: if not last question, increment `_currentIndex` and reset per-question state; if last question, call `_submitToSheets`, set `_screen = 'result'`, and trigger `_fireConfetti()` if score/total ≥ 0.8
  - **Requirement:** 3.2, 3.3, 3.4, 4.1, 4.2, 5.1, 5.4, 7.6

- [x] 8. Implement Layar_Hasil render branch and `_restartQuiz()` method
  - Add `_renderResultScreen()` returning the Layar_Hasil template: `.result-name`, `.result-score`, `.result-percentage` (`Math.round((score/total)*100)%`), `.result-message` (threshold: ≥80% → messageHigh, ≥50% → messageMedium, <50% → messageLow), and `button.restart-btn` with `aria-label`
  - Implement `_restartQuiz()` resetting all state: `_screen='name'`, `_studentName=''`, `_currentIndex=0`, `_score=0`, `_answered=false`, `_selectedIndex=-1`, `_feedbackText=''`, `_feedbackPositive=false`, `_validationError=''`, `_nameInputValue=''`
  - **Requirement:** 7.1, 7.2, 7.3, 7.4, 7.5

- [x] 9. Implement `_submitToSheets(name, score)` (SheetsConnector)
  - Guard: if `globalThis.google?.script?.run` is unavailable, `console.warn(...)` and return
  - Build payload: `{ timestamp: new Date().toISOString(), name, score }`
  - Call `globalThis.google.script.run.withSuccessHandler(...).withFailureHandler(...)[this.scriptFunctionName](payload)`
  - Success handler: `console.log('[explode-quiz] Data berhasil dikirim ke Sheets')`
  - Failure handler: `console.error('[explode-quiz] Gagal mengirim ke Sheets:', err)`
  - **Requirement:** 8.1, 8.2, 8.3, 8.4, 8.5, 8.6

- [x] 10. Implement `render()` and `static get styles()`
  - `render()`: switch on `_screen` to dispatch to `_renderNameScreen()`, `_renderQuestionScreen()`, or `_renderResultScreen()`
  - `static get styles()`: return `[super.styles, css\`...\`]` with `:host` (max-width 640px, centered, DDD spacing/font tokens), `.answer-grid` (2-column grid, DDD gap tokens), `@media (max-width: 480px)` (single column, min-height 44px for `.answer-btn`), `.answer-btn--correct` / `.answer-btn--wrong` (DDD color tokens only), `button:focus-visible` / `input:focus-visible` (DDD focus-ring token), `[disabled]` (DDD disabled token) — no hard-coded design values
  - **Requirement:** 1.6, 9.1, 9.2, 9.3, 9.4, 9.6, 9.7

- [x] 11. Create `demo/index.html`
  - HTML page importing `../explode-quiz.js` via `<script type="module">`
  - One `<explode-quiz>` instance using default questions
  - One `<explode-quiz>` instance with custom `questions` attribute to demonstrate property injection
  - Minimal page styling and descriptive heading
  - **Requirement:** 10.4

- [x] 12. Write unit tests (example-based) in `test/explode-quiz.test.js`
  - Smoke tests: element is defined, `tag === 'explode-quiz'`, default questions ≥ 3, `haxProperties` has `gizmo` and `settings`
  - Layar_Nama: initial render shows `#name-input` and `button.start-btn`; empty name shows validation error and stays on 'name'; valid name (>2 chars) transitions to 'question'; Enter key on input with valid name calls `_startQuiz()`
  - Layar_Soal: renders exactly 4 `.answer-btn`; all 4 buttons gain `[disabled]` after `_selectAnswer()`; correct answer increments `_score`; wrong answer does not change `_score`; correct button gets `answer-btn--correct`; wrong button gets `answer-btn--wrong` and correct button gets `answer-btn--correct`; `_feedbackText` is non-empty after answering
  - Layar_Hasil: after last question `_screen === 'result'`; restart button resets all state to initial values and `_screen === 'name'`
  - SheetsConnector: logs warning when `google.script.run` unavailable; calls `google.script.run[scriptFunctionName]` when available (mock `globalThis.google`)
  - Konfeti: `_confettiFn` is null when canvas-confetti import fails; `_fireConfetti()` does not throw when `_confettiFn` is null
  - **Requirement:** 2.1–2.6, 3.1–3.4, 4.1–4.4, 5.3, 7.5, 8.3, 8.4

- [x] 13. Write property-based tests (PBT) in `test/explode-quiz.test.js`
  - All PBT suites use `numRuns: 100` and tag comment `// Feature: interactive-quiz, Property {N}: {text}`
  - **Property 1** — Name validation rejection: `fc.string().filter(s => s.trim().length <= 2)` → `_screen === 'name'` and `_validationError` non-empty after `_startQuiz()`
  - **Property 2** — Name validation acceptance: `fc.string({ minLength: 3 }).filter(s => s.trim().length > 2)` → `_screen === 'question'`, `_studentName === trimmed`, `_validationError === ''`
  - **Property 3** — Question screen structure invariant: for any valid Question and any `_currentIndex`, shadow DOM contains question text, progress label "Soal N dari M", and exactly 4 `.answer-btn` elements
  - **Property 4** — Buttons disabled after answer: `fc.integer({ min: 0, max: 3 })` → after `_selectAnswer(i)` all 4 `.answer-btn[disabled]` present
  - **Property 5** — Score +1 for correct answer: question arbitrary + `fc.integer({ min: 0 })` initial score → `_score === S + 1` after `_selectAnswer(correctIndex)`
  - **Property 6** — Score unchanged for wrong answer: question arbitrary + wrong index filtered `i !== correctIndex` → `_score === S` unchanged
  - **Property 7** — Correct feedback color: after `_selectAnswer(correctIndex)`, selected button has `answer-btn--correct`, `_feedbackPositive === true`
  - **Property 8** — Wrong feedback color: after `_selectAnswer(wrongIndex)`, selected button has `answer-btn--wrong` and button at `correctIndex` has `answer-btn--correct`
  - **Property 9** — Confetti exactly once: spy on `_confettiFn`; after `_selectAnswer(correctIndex)`, spy call count === 1 regardless of re-renders
  - **Property 10** — Result screen completeness: `fc.string({ minLength: 3 })`, `fc.integer({ min: 0 })`, `fc.integer({ min: 1 })` → shadow DOM contains name, score, total, and percentage when `_screen === 'result'`
  - **Property 11** — Appreciation message threshold: for any (score, total), result screen shows correct message tier (exhaustive and mutually exclusive across all three cases)
  - **Property 12** — Sheets payload format: for any (studentName, score), payload to `google.script.run[fn]` has valid ISO 8601 `timestamp`, `name === studentName`, `score === integer`
  - **Property 13** — Questions round-trip: `fc.array(questionArbitrary, { minLength: 1 })` → `el.questions` has same length, order, and content as assigned array
  - **Property 14** — All interactive elements have non-empty aria-label: for any screen state, all buttons and inputs in shadow DOM have `aria-label` with trimmed length > 0
  - **Requirement:** All 14 Correctness Properties from design.md

## Summary

### Completed Tasks (1-13)
- Task 1: Package scaffolding ✅
- Task 2: Component skeleton ✅
- Task 3: connectedCallback with canvas-confetti ✅
- Task 4: _fireConfetti() ✅
- Task 5: Layar_Nama ✅
- Task 6: Layar_Soal ✅
- Task 7: _selectAnswer/_advanceQuiz ✅
- Task 8: Layar_Hasil ✅
- Task 9: SheetsConnector ✅
- Task 10: render/styles ✅
- Task 11: demo/index.html ✅
- Task 12: Unit tests ✅
- Task 13: Property-based tests ✅

### Remaining Tasks (23-31)
- [x] Task 23: Add `editing` property and internal state
- [x] Task 24: Implement `_openEditor()` method
- [x] Task 25: Implement `_cancelAll()` and `_saveAll()` methods
- [x] Task 26: Implement `_renderEditorScreen()` method
- [x] Task 27: Implement CRUD operations (_addQuestion, _deleteQuestion, etc.)
- [x] Task 28: Implement edit save/cancel operations
- [x] Task 29: Implement editor-specific CSS styles
- Task 30: Add editor unit tests
- Task 31: Add editor property-based tests

### Next Steps
The core quiz functionality is complete and tested. The remaining tasks focus on adding the interactive question editor UI for in-browser question management.

### Editor State & Properties

- [x] 23. Add `editing` property and internal state for editor
  - Add public property `editing: { type: Boolean, attribute: true, reflect: true }`
  - Add internal state: `_editing` (Boolean), `_tempQuestions` (Array), `_editingIndex` (Number)
  - Initialize `_editing = false`, `_tempQuestions = []`, `_editingIndex = -1` in constructor
  - Add i18n strings for editor UI (editTitle, closeEditor, addQuestionBtn, saveAllBtn, cancelAllBtn, etc.)
  - **Requirement:** 14.1

- [x] 24. Implement `_openEditor()` method
  - Guard: only allow opening editor from `result` screen (or add separate control)
  - Copy `this.questions` to `_tempQuestions`
  - Set `_editing = true`, `_editingIndex = -1`
  - Set `_screen = 'editor'`
  - **Requirement:** 14.1

### Editor Navigation

- [x] 25. Implement `_cancelAll()` and `_saveAll()` methods
  - `_cancelAll()`: reset `_editing = false`, set `_screen = 'result'` (discard `_tempQuestions`)
  - `_saveAll()`: assign `_tempQuestions` to `this.questions`, reset `_editing = false`, set `_screen = 'result'`
  - **Requirement:** 14.4, 14.5, 14.12

### Editor UI Rendering

- [x] 26. Implement `_renderEditorScreen()` method
  - Header with `.edit-title` and `.close-editor-btn` (`aria-label`)
  - Add question form with: textarea for question, 4 inputs for choices, radio buttons for correct choice, `.add-question-btn`
  - `.questions-list` with `.question-card` elements for each question in `_tempQuestions`
  - Each card has: `.question-preview`, `.card-actions` with `.edit-btn` and `.delete-btn`
  - Footer with `.editor-actions` containing `.save-all-btn` and `.cancel-all-btn`
  - **Requirement:** 14.1, 14.2, 14.3, 14.10, 14.11

### CRUD Operations

- [x] 27. Implement `_addQuestion()`, `_deleteQuestion(index)`, `_startEditQuestion(index)`
  - `_addQuestion()`: validate form, create Question object, push to `_tempQuestions`, reset form
  - `_deleteQuestion(index)`: guard if `_tempQuestions.length <= 3`, remove from array
  - `_startEditQuestion(index)`: set `_editingIndex = index`, load question data to temporary form
  - **Requirement:** 14.2, 14.6, 14.7, 14.8, 14.9

- [x] 28. Implement `_saveEditQuestion()` and `_cancelEditQuestion()`
  - `_saveEditQuestion()`: update question at `_editingIndex` in `_tempQuestions`, reset `_editingIndex = -1`
  - `_cancelEditQuestion()`: reset `_editingIndex = -1` (discard changes)
  - **Requirement:** 14.7, 14.8

### Styling

- [x] 29. Implement editor-specific CSS styles
  - Editor header styling (`.edit-header`, `.edit-title`, `.close-editor-btn`)
  - Add question form styling (`.add-question-form`, `.question-text-input`, `.choices-container`)
  - Question card styling (`.question-card`, `.card-header`, `.card-actions`)
  - Editor actions styling (`.editor-actions`, `.save-all-btn`, `.cancel-all-btn`)
  - Responsive: single column for choices on mobile (`@media (max-width: 480px)`)
  - **Requirement:** 14.10

### Tests

- [ ] 30. Add editor unit tests in `test/explode-quiz.test.js`
  - Editor UI rendering: verify all editor elements present when `editing === true`
  - Add question: validates inputs, adds to `_tempQuestions`, resets form
  - Delete question: guards at 3 questions, removes from `_tempQuestions` when > 3
  - Edit question flow: loads data, saves changes, cancels without saving
  - Save/Cancel all: preserves or discards changes, exits editor mode
  - Accessibility: all editor elements have non-empty aria-label
  - **Requirement:** 14.1–14.12

- [ ] 31. Add editor property-based tests in `test/explode-quiz.test.js`
  - **Property 15** — Editor UI rendering: for `editing === true`, shadow DOM contains editor header, form, questions list, and actions
  - **Property 16** — Add question validation: for empty question or choices, `_tempQuestions` unchanged and error shown
  - **Property 17** — Delete question guard: for `_tempQuestions.length <= 3`, all delete buttons disabled
  - **Property 18** — Save all preserves questions: after `_saveAll()`, `questions === _tempQuestions` and `editing === false`
  - **Property 19** — Cancel all discards changes: after `_cancelAll()`, `questions` unchanged and `editing === false`
  - **Property 20** — Edit question flow: edit loads data, save updates, cancel discards
  - **Property 21** — Cancel edit discards changes: `_tempQuestions` unchanged after cancel edit
  - **Property 22** — All editor elements have aria-label: all interactive elements in editor have non-empty aria-label
  - **Requirement:** All 8 new Correctness Properties from design.md

## Task Dependency Graph

```json
{
  "waves": [
    ["1", "2"],
    ["3", "4", "5", "6", "8", "9", "11"],
    ["7", "10"],
    ["12", "13"],
    ["23"],
    ["24", "25"],
    ["26"],
    ["27", "28"],
    ["29"],
    ["30", "31"]
  ]
}
```

## Implementation Notes

### Critical Constraints

- Import `canvas-confetti` only from `canvas-confetti/dist/confetti.module.mjs` �� never from TypeScript source (monorepo rule)
- All design values (color, spacing, font, radius, shadow) must use DDD CSS custom properties — no hard-coded values
- `custom-elements.json` is auto-generated by `cem analyze --litelement`; do not edit manually
- Use `globalThis` instead of `window` throughout the component
- The `_answered` flag is the sole guard against double-submission; do not remove it

### Testing Setup

- Run `npm install` from `elements/explode/` before running tests or build
- `fast-check` version `^4.8.0` matches the `todo-list` precedent in this monorepo
- Property-based tests require `numRuns: 100` per test suite

### Build Process

1. Run `npm install` to install dependencies
2. Run `yarn run build` (or `hax-build`) to generate `custom-elements.json`
3. Run `npm test` to verify all unit and property-based tests pass
4. Run `hax audit` to verify DDD compliance before opening a PR

### Integration Checklist

- [x] Demo page (`demo/index.html`) renders correctly in browser
- [ ] All 30 tasks from above completed
- [ ] All 22 correctness properties verified (14 base + 8 editor-specific)
- [ ] `hax audit` passes with no errors
- [ ] `npm test` passes with no failures

## Notes

This task list has been reorganized with proper sequential numbering (1-31), with the interactive editor tasks renumbered to 23-31. The task dependency graph reflects the logical flow of implementation.