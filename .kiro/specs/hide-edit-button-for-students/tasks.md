# Implementation Plan: hide-edit-button-for-students

## Overview

Single-file change to `elements/explode/explode-quiz.js`. The plan adds the `editable` Boolean property (default `false`, `reflect: true`) to the `ExplodeQuiz` LitElement, wraps the two edit buttons in conditional template expressions, registers the property in `haxProperties`, and validates all four correctness properties with fast-check tests in the existing test file.

## Tasks

- [x] 1. Add `editable` property to `ExplodeQuiz`
  - [x] 1.1 Declare `editable` in `static get properties()`
    - Add `editable: { type: Boolean, attribute: true, reflect: true }` to the property map alongside the existing properties in `explode-quiz.js`
    - _Requirements: 1.1_

  - [x] 1.2 Initialise `editable` in the constructor
    - Add `this.editable = false` in `constructor()` so the default student-view is active without any HTML attribute
    - _Requirements: 1.2, 1.3, 5.1_

- [x] 2. Apply conditional rendering for the edit button
  - [x] 2.1 Wrap the edit button in `_renderNameScreen()` with an `editable` guard
    - Replace the unconditional `<button class="edit-questions-btn">` in `_renderNameScreen()` with `${this.editable ? html\`<button …>\` : ''}` so the button is absent from the DOM when `editable === false`
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 6.1, 6.2, 6.4_

  - [x] 2.2 Wrap the edit button in `_renderResultScreen()` with an `editable` guard
    - Apply the same conditional template to the edit button in `_renderResultScreen()`, making it DOM-absent when `editable === false`
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 6.1, 6.2, 6.4_

- [x] 3. Register `editable` in `haxProperties`
  - [x] 3.1 Add `editable` entry to `settings.configure` in `static get haxProperties()`
    - Insert `{ property: 'editable', title: 'Mode Edit (Instruktur)', description: 'Aktifkan untuk menampilkan tombol edit soal kuis', inputMethod: 'boolean' }` into the `configure` array
    - _Requirements: 4.1, 4.2, 4.3, 4.4_

- [ ] 4. Write tests for the new `editable` property
  - [ ] 4.1 Add unit / example-based tests in `explode-quiz.test.js`
    - Test that `editable` defaults to `false` on a fresh instance
    - Test that `editing` still defaults to `false` (non-regression, Req 5.3)
    - Test that `haxProperties.settings.configure` contains the `editable` entry with `inputMethod: 'boolean'` (Req 4.1, 4.2)
    - Test `editable false → true` on name screen shows button after `updateComplete` (Req 2.4)
    - Test `editable true → false` on name screen removes button from DOM after `updateComplete` (Req 2.5)
    - Test `editable false → true` on result screen shows button after `updateComplete` (Req 3.4)
    - Test `editable true → false` on result screen removes button from DOM after `updateComplete` (Req 3.5)
    - Test that `querySelectorAll('.edit-questions-btn')` returns empty NodeList (not CSS-hidden) when `editable === false` (Req 6.4)
    - _Requirements: 1.2, 2.4, 2.5, 3.4, 3.5, 4.1, 4.2, 5.3, 6.4_

  - [ ]* 4.2 Write property test for Property 1: Edit button absent from DOM when editable is false
    - **Property 1: Edit button absent from DOM when editable is false**
    - **Validates: Requirements 1.3, 1.6, 2.1, 3.1, 5.1, 6.1, 6.2**
    - Generate arbitrary `questions` array (minLength: 1), arbitrary `studentName` (minLength: 1), arbitrary `score` (integer ≥ 0)
    - Render component without `editable`, set `_screen` to `'name'`, assert `shadowRoot.querySelector('.edit-questions-btn')` is null
    - Repeat with `_screen = 'result'`, same assertion
    - Use `numRuns: 100`

  - [ ]* 4.3 Write property test for Property 2: Edit button present in DOM with aria-label when editable is true
    - **Property 2: Edit button present in DOM with aria-label when editable is true**
    - **Validates: Requirements 1.4, 1.7, 2.2, 3.2, 6.3**
    - Generate arbitrary `questions` array (minLength: 1), arbitrary `studentName` (minLength: 1), arbitrary `score` (integer ≥ 0)
    - Render component with `editable` attribute set, set `_screen` to `'name'`, assert button exists and has a non-empty `aria-label`
    - Repeat with `_screen = 'result'`, same assertions
    - Use `numRuns: 100`

  - [ ]* 4.4 Write property test for Property 3: Clicking edit button navigates to editor screen
    - **Property 3: Clicking edit button navigates to editor screen**
    - **Validates: Requirements 2.3, 3.3**
    - Generate arbitrary `questions` array (minLength: 3)
    - Render with `editable=true` on name screen, click `.edit-questions-btn`, assert `_screen === 'editor'`
    - Reset component, set to result screen, click `.edit-questions-btn`, assert `_screen === 'editor'`
    - Use `numRuns: 20`

  - [ ]* 4.5 Write property test for Property 4: editable and editing are independent properties
    - **Property 4: editable and editing are independent properties**
    - **Validates: Requirements 1.5**
    - Generate `fc.boolean()` for initial `editable`, `fc.boolean()` for initial `editing`, `fc.boolean()` for new `editable` value
    - Set both, then change `editable` — assert `editing` is unchanged
    - Reverse: set both, then change `editing` — assert `editable` is unchanged
    - Use `numRuns: 100`

- [ ] 5. Final checkpoint — Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.
  - Run `cd elements/explode && npm test`
  - Verify existing 14 properties + unit tests still pass (regression check, Req 5.2)

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- All changes are confined to a single file (`elements/explode/explode-quiz.js`) plus the test file
- No new dependencies, no build-pipeline changes required
- `_openEditor()` and `_openEditorFromName()` are intentionally left unchanged — the existing guards remain as defense-in-depth
- Setting `editable="false"` in HTML results in `editable === true` per LitElement Boolean type semantics; absence of the attribute is the correct way to disable
- After implementation run `yarn run build` to regenerate `custom-elements.json`

## Task Dependency Graph

```json
{
  "waves": [
    { "id": 0, "tasks": ["1.1", "1.2"] },
    { "id": 1, "tasks": ["2.1", "2.2", "3.1"] },
    { "id": 2, "tasks": ["4.1", "4.2", "4.3", "4.4", "4.5"] }
  ]
}
```
