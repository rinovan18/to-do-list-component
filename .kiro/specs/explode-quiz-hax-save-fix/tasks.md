# Implementation Plan

## Overview

Exploratory bugfix for the `<explode-quiz>` component. The `questions` Array property does not reflect to the DOM attribute, so HAX editor cannot serialize it when saving. Two targeted changes in `elements/explode/explode-quiz.js` are required: add `reflect: true` + JSON converter to the `questions` property, and fix the `updated()` null guard. Tests are written in the bug-condition-first order: explore the bug, lock in preservation behaviour, then implement and verify.

## Task Dependency Graph

```json
{
  "waves": [
    ["1", "2"],
    ["3.1", "3.2"],
    ["3.3", "3.4"],
    ["4"]
  ]
}
```

## Tasks

- [ ] 1. Write bug condition exploration test
  - **Property 1: Bug Condition** - Questions Array Does Not Reflect to DOM Attribute
  - **CRITICAL**: This test MUST FAIL on unfixed code — failure confirms the bug exists
  - **DO NOT attempt to fix the test or the code when it fails**
  - **NOTE**: This test encodes the expected behavior — it will validate the fix when it passes after implementation
  - **GOAL**: Surface counterexamples that demonstrate that `getAttribute("questions")` returns `null` after programmatic assignment
  - **Scoped PBT Approach**: Scope the property to concrete failing cases — any valid question array assigned to `el.questions` where `reflect: true` and a JSON converter are absent
  - Add a new `describe` block in `elements/explode/test/explode-quiz.test.js` (after existing Property-Based Tests section)
  - Write the following unit sub-cases (all should FAIL on unfixed code):
    - **getAttribute reflects after assignment**: assign `el.questions = [{question:'Q', choices:['A','B','C','D'], correctIndex:0}]`, await `el.updateComplete`, assert `el.getAttribute('questions') !== null`
    - **JSON round-trip**: assign a custom array, assert `JSON.parse(el.getAttribute('questions'))` deep-equals the assigned array
    - **Init from attribute**: `fixture(html\`<explode-quiz questions='[{"question":"Q","choices":["A","B","C","D"],"correctIndex":0}]'></explode-quiz>\`)`, assert `el.questions[0].question === 'Q'`
  - Write the PBT property test (fast-check):
    - `fc.array(validQuestionArbitrary, { minLength: 1 })` → assign to `el.questions` → assert `getAttribute('questions') !== null` AND `JSON.parse(getAttribute('questions'))` deep-equals input
  - Run test with `npm test` from `elements/explode/` directory
  - **EXPECTED OUTCOME**: Tests FAIL (this is correct — it proves the bug exists; `getAttribute("questions")` returns `null` because `reflect: true` is missing)
  - Document counterexample found (e.g., `el.questions = [{...}]` → `getAttribute("questions")` → `null`)
  - Mark task complete when tests are written, run, and failure is documented
  - _Requirements: 1.1, 1.2, 1.4_

- [ ] 2. Write preservation property tests (BEFORE implementing fix)
  - **Property 2: Preservation** - No-Attribute Fallback to DEFAULT_QUESTIONS
  - **IMPORTANT**: Follow observation-first methodology
  - Observe behavior on UNFIXED code for non-buggy inputs (elements with no `questions` attribute set externally via HAX):
    - Observe: `await fixture(html\`<explode-quiz></explode-quiz>\`)` → `el.questions` deep-equals `DEFAULT_QUESTIONS` (3 default questions)
    - Observe: `el.questions.length` equals `3` with the Bahasa Indonesia default questions
    - Observe: after completing quiz flow (name → question → result), `_screen` transitions correctly
    - Observe: `scriptFunctionName`, `editable`, `editing` attributes are unaffected
  - Write the following preservation tests in `elements/explode/test/explode-quiz.test.js`:
    - **No-attribute fallback**: element without `questions` attribute uses `DEFAULT_QUESTIONS` (assert deep-equals)
    - **Invalid JSON fallback**: `fixture(html\`<explode-quiz questions='not-valid-json'></explode-quiz>\`)` → assert `el.questions` deep-equals `DEFAULT_QUESTIONS`
    - **Empty array fallback**: `fixture(html\`<explode-quiz questions='[]'></explode-quiz>\`)` → assert `el.questions` deep-equals `DEFAULT_QUESTIONS`
    - **null reset**: set `el.questions = null`, await `el.updateComplete`, assert `el.questions` deep-equals `DEFAULT_QUESTIONS`
    - **Other properties unaffected**: assign a valid `questions` array, assert `el.scriptFunctionName` still equals `'submitQuizResult'`, `el.editable` still equals `false`
  - Write the PBT property test (fast-check):
    - **Property 2: Preservation** — for all arbitrary state where no custom `questions` attribute is present: `el.questions` deep-equals `DEFAULT_QUESTIONS`
    - Use `fc.constant(undefined)` or simply instantiate without attribute, vary internal state (`_screen`, `_score`, etc.) — assert questions fallback holds
  - Run tests with `npm test` from `elements/explode/` directory
  - **EXPECTED OUTCOME**: Tests PASS on UNFIXED code (confirms baseline behavior to preserve)
  - Mark task complete when tests are written, run, and passing on unfixed code
  - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5_

- [ ] 3. Fix: questions property reflect + updated() null guard

  - [ ] 3.1 Implement Change 1 — add `reflect: true` and JSON converter to `questions` in `static get properties()`
    - Open `elements/explode/explode-quiz.js`
    - Replace the buggy declaration:
      ```js
      questions: { type: Array, attribute: true },
      ```
      with the fixed declaration:
      ```js
      questions: {
        type: Array,
        attribute: 'questions',
        reflect: true,
        converter: {
          fromAttribute: (value) => {
            if (!value) return null
            try { return JSON.parse(value) } catch { return null }
          },
          toAttribute: (value) => {
            if (!value) return null
            try { return JSON.stringify(value) } catch { return null }
          },
        },
      },
      ```
    - _Bug_Condition: isBugCondition(X) where X.questions IS Array AND X.getAttribute("questions") = null AND reflect IS false_
    - _Expected_Behavior: getAttribute("questions") returns valid JSON string; JSON.parse(getAttribute("questions")) deep-equals el.questions_
    - _Preservation: Unchanged for elements without a custom questions attribute — they still use DEFAULT_QUESTIONS via updated() fallback_
    - _Requirements: 2.1, 2.2, 2.3, 2.4_

  - [ ] 3.2 Implement Change 2 — fix `updated()` null guard
    - In `elements/explode/explode-quiz.js`, in the `updated()` method, replace:
      ```js
      if (this.questions && this.questions.length === 0) {
        this.questions = DEFAULT_QUESTIONS;
      }
      ```
      with:
      ```js
      if (!this.questions || this.questions.length === 0) {
        this.questions = DEFAULT_QUESTIONS;
      }
      ```
    - This handles the new `null` return from `fromAttribute` when the attribute contains invalid JSON or an empty value
    - _Bug_Condition: fromAttribute returns null for invalid/empty JSON attribute_
    - _Expected_Behavior: null questions triggers DEFAULT_QUESTIONS fallback; empty array [] also triggers fallback_
    - _Preservation: Valid non-empty arrays pass through unchanged; existing quiz flow unaffected_
    - _Requirements: 2.4, 3.1, 3.2_

  - [ ] 3.3 Verify bug condition exploration test now passes
    - **Property 1: Expected Behavior** - Questions Array Reflects to DOM Attribute
    - **IMPORTANT**: Re-run the SAME tests from task 1 — do NOT write new tests
    - The tests from task 1 encode the expected behavior after fix
    - Run `npm test` from `elements/explode/` directory
    - **EXPECTED OUTCOME**: All Property 1 tests PASS (confirms bug is fixed — `getAttribute("questions")` now returns valid JSON string)
    - Verify: `getAttribute("questions")` is non-null after assignment
    - Verify: `JSON.parse(getAttribute("questions"))` deep-equals the assigned array
    - Verify: `fixture(html\`<explode-quiz questions='[...]'>\`)` correctly parses and uses the attribute
    - _Requirements: 2.1, 2.2, 2.3, 2.4_

  - [ ] 3.4 Verify preservation tests still pass
    - **Property 2: Preservation** - No-Attribute Fallback to DEFAULT_QUESTIONS
    - **IMPORTANT**: Re-run the SAME tests from task 2 — do NOT write new tests
    - Run `npm test` from `elements/explode/` directory
    - **EXPECTED OUTCOME**: All Property 2 tests PASS (confirms no regressions)
    - Confirm: element without `questions` attribute still uses `DEFAULT_QUESTIONS`
    - Confirm: invalid JSON attribute falls back to `DEFAULT_QUESTIONS`
    - Confirm: empty array `[]` attribute falls back to `DEFAULT_QUESTIONS`
    - Confirm: `null` reset falls back to `DEFAULT_QUESTIONS`
    - Confirm: `scriptFunctionName`, `editable`, `editing` are unaffected
    - Confirm: all pre-existing tests (Smoke, Layar_Nama, Layar_Soal, Layar_Hasil, Properties 1–14) still pass

- [ ] 4. Checkpoint — Ensure all tests pass
  - Run `npm test` from `elements/explode/` directory (uses `wtr test/**/*.test.js --node-resolve --run`)
  - All tests must pass: existing unit tests, existing PBTs (Properties 1–14), new Property 1 bug-condition tests, new Property 2 preservation tests
  - Run `npm run lint` from `elements/explode/` — no lint errors
  - Run `npm run build` from `elements/explode/` — regenerates `custom-elements.json` (required pre-PR per contributing guide)
  - Ensure all tests pass; ask the user if any questions arise

## Notes

- The test file is `elements/explode/test/explode-quiz.test.js`; add new `describe` blocks after the existing `Property-Based Tests` section — do not remove or modify existing tests
- Run all tests from `elements/explode/` with `npm test` (uses `wtr --node-resolve --run`)
- The existing `validQuestionArbitrary` fast-check arbitrary defined at the top of the test file can be reused in the new property tests
- `DEFAULT_QUESTIONS` is defined at module scope in `explode-quiz.js` but is not currently exposed as a public property; reference expected length (3) and spot-check known values in tests rather than importing the constant directly
- `sinon` is used in some existing tests; it is available via `@open-wc/testing` test environment
- Both code changes are in a single file (`explode-quiz.js`) and are independent of each other; they can be applied together in one edit session
- After implementation, run `npm run build` to regenerate `custom-elements.json` as required by the project contributing guide before opening a PR
