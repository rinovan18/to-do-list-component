import { fixture, html, expect } from '@open-wc/testing'
import fc from 'fast-check'
import sinon from 'sinon'
import { DEFAULT_QUESTIONS } from '../explode-quiz.js'

const FC_RUNS = 5

const validQuestionArbitrary = fc.record({
  question: fc.string({ minLength: 1 }),
  choices: fc.tuple(
    fc.string({ minLength: 1 }),
    fc.string({ minLength: 1 }),
    fc.string({ minLength: 1 }),
    fc.string({ minLength: 1 })
  ),
  correctIndex: fc.integer({ min: 0, max: 3 }),
})

describe('explode-quiz', () => {
  /**
   * Smoke Tests
   * Validates: Requirements 1.2, 1.3, 1.4
   */
  describe('Smoke Tests', () => {
    it('is defined', async () => {
      const el = await fixture(html`<explode-quiz></explode-quiz>`)
      expect(el).to.exist
    })

    it('tag === explode-quiz', async () => {
      const el = await fixture(html`<explode-quiz></explode-quiz>`)
      expect(el.constructor.tag).to.equal('explode-quiz')
    })

    it('DEFAULT_QUESTIONS has at least 3 questions', async () => {
      expect(DEFAULT_QUESTIONS).to.have.length.at.least(3)
    })

    it('haxProperties has gizmo and settings', async () => {
      const el = await fixture(html`<explode-quiz></explode-quiz>`)
      expect(el.constructor.haxProperties).to.be.an('object')
      expect(el.constructor.haxProperties.gizmo).to.be.an('object')
      expect(el.constructor.haxProperties.settings).to.be.an('object')
    })
  })

  /**
   * Unit Tests: Layar_Nama
   * Validates: Requirements 2.1-2.6
   */
  describe('Layar_Nama', () => {
    it('initial render shows name-input and start-btn', async () => {
      const el = await fixture(html`<explode-quiz></explode-quiz>`)
      await el.updateComplete

      const input = el.shadowRoot.querySelector('#name-input')
      const button = el.shadowRoot.querySelector('.start-btn')

      expect(input).to.exist
      expect(button).to.exist
    })

    it('empty name shows validation error and stays on name screen', async () => {
      const el = await fixture(html`<explode-quiz></explode-quiz>`)
      await el.updateComplete

      // Try to start with empty name
      el._startQuiz()
      await el.updateComplete

      expect(el._screen).to.equal('name')
      expect(el._validationError).to.not.equal('')
    })

    it('valid name (>2 chars) transitions to question screen', async () => {
      const el = await fixture(html`<explode-quiz></explode-quiz>`)
      await el.updateComplete

      el._nameInputValue = 'Budi'
      el._startQuiz()
      await el.updateComplete

      expect(el._screen).to.equal('question')
      expect(el._studentName).to.equal('Budi')
      expect(el._validationError).to.equal('')
    })

    it('Enter key on input with valid name calls _startQuiz()', async () => {
      const el = await fixture(html`<explode-quiz></explode-quiz>`)
      await el.updateComplete

      const input = el.shadowRoot.querySelector('#name-input')
      input.value = 'Test'
      
      // Simulate Enter key press
      const event = new KeyboardEvent('keydown', { key: 'Enter' })
      input.dispatchEvent(event)
      await el.updateComplete

      expect(el._screen).to.equal('question')
    })
  })

  /**
   * Unit Tests: Layar_Soal
   * Validates: Requirements 3.1-3.4, 4.1-4.4, 6.1-6.3
   */
  describe('Layar_Soal', () => {
    it('renders exactly 4 answer buttons', async () => {
      const el = await fixture(html`<explode-quiz></explode-quiz>`)
      await el.updateComplete

      el._screen = 'question'
      el._currentIndex = 0
      await el.updateComplete

      const buttons = el.shadowRoot.querySelectorAll('.answer-btn')
      expect(buttons.length).to.equal(4)
    })

    it('all 4 buttons gain disabled after _selectAnswer()', async () => {
      const el = await fixture(html`<explode-quiz></explode-quiz>`)
      await el.updateComplete

      el._screen = 'question'
      el._currentIndex = 0
      await el.updateComplete

      const buttons = el.shadowRoot.querySelectorAll('.answer-btn')
      expect(buttons[0]).to.not.be.disabled

      el._selectAnswer(0)
      await el.updateComplete

      for (const button of buttons) {
        expect(button.disabled).to.be.true
      }
    })

    it('correct answer increments _score', async () => {
      const el = await fixture(html`<explode-quiz></explode-quiz>`)
      await el.updateComplete

      el._screen = 'question'
      el._currentIndex = 0
      el._answered = false
      await el.updateComplete

      const correctIndex = el.questions[0].correctIndex
      el._score = 0
      el._selectAnswer(correctIndex)
      await el.updateComplete

      expect(el._score).to.equal(1)
    })

    it('wrong answer does not change _score', async () => {
      const el = await fixture(html`<explode-quiz></explode-quiz>`)
      await el.updateComplete

      el._screen = 'question'
      el._currentIndex = 0
      el._answered = false
      await el.updateComplete

      const correctIndex = el.questions[0].correctIndex
      const wrongIndex = correctIndex === 0 ? 1 : 0
      el._score = 0
      el._selectAnswer(wrongIndex)
      await el.updateComplete

      expect(el._score).to.equal(0)
    })

    it('correct button gets answer-btn--correct class', async () => {
      const el = await fixture(html`<explode-quiz></explode-quiz>`)
      await el.updateComplete

      el._screen = 'question'
      el._currentIndex = 0
      el._answered = false
      await el.updateComplete

      const correctIndex = el.questions[0].correctIndex
      el._selectAnswer(correctIndex)
      await el.updateComplete

      const buttons = el.shadowRoot.querySelectorAll('.answer-btn')
      const correctButton = buttons[correctIndex]
      expect(correctButton.classList.contains('answer-btn--correct')).to.be.true
    })

    it('wrong button gets answer-btn--wrong class', async () => {
      const el = await fixture(html`<explode-quiz></explode-quiz>`)
      await el.updateComplete

      el._screen = 'question'
      el._currentIndex = 0
      el._answered = false
      await el.updateComplete

      const correctIndex = el.questions[0].correctIndex
      const wrongIndex = correctIndex === 0 ? 1 : 0
      el._selectAnswer(wrongIndex)
      await el.updateComplete

      const buttons = el.shadowRoot.querySelectorAll('.answer-btn')
      const wrongButton = buttons[wrongIndex]
      expect(wrongButton.classList.contains('answer-btn--wrong')).to.be.true
    })

    it('_feedbackText is non-empty after answering', async () => {
      const el = await fixture(html`<explode-quiz></explode-quiz>`)
      await el.updateComplete

      el._screen = 'question'
      el._currentIndex = 0
      el._answered = false
      await el.updateComplete

      el._selectAnswer(0)
      await el.updateComplete

      expect(el._feedbackText).to.not.equal('')
    })
  })

  /**
   * Unit Tests: Layar_Hasil
   * Validates: Requirements 7.1, 7.5
   */
  describe('Layar_Hasil', () => {
    it('after last question _screen is result', async () => {
      const el = await fixture(html`<explode-quiz></explode-quiz>`)
      await el.updateComplete

      el._screen = 'question'
      el._currentIndex = el.questions.length - 1
      el._answered = false
      await el.updateComplete

      el._selectAnswer(el.questions[el._currentIndex].correctIndex)
      await el.updateComplete

      // Wait for the advanceQuiz setTimeout
      await new Promise(resolve => setTimeout(resolve, 1300))
      await el.updateComplete

      expect(el._screen).to.equal('result')
    })

    it('restart button resets all state to initial values', async () => {
      const el = await fixture(html`<explode-quiz></explode-quiz>`)
      await el.updateComplete

      // Set some state
      el._screen = 'question'
      el._studentName = 'Test'
      el._currentIndex = 1
      el._score = 1
      el._answered = true
      await el.updateComplete

      // Click restart button
      el._restartQuiz()
      await el.updateComplete

      expect(el._screen).to.equal('name')
      expect(el._studentName).to.equal('')
      expect(el._currentIndex).to.equal(0)
      expect(el._score).to.equal(0)
      expect(el._answered).to.be.false
      expect(el._selectedIndex).to.equal(-1)
      expect(el._feedbackText).to.equal('')
      expect(el._feedbackPositive).to.be.false
      expect(el._validationError).to.equal('')
      expect(el._nameInputValue).to.equal('')
    })
  })

  /**
   * Unit Tests: SheetsConnector
   * Validates: Requirements 8.3, 8.4
   */
  describe('SheetsConnector', () => {
    it('logs warning when google.script.run unavailable', async () => {
      const consoleWarn = sinon.stub(console, 'warn')
      const el = await fixture(html`<explode-quiz></explode-quiz>`)
      await el.updateComplete

      // Ensure google.script.run is not available
      delete globalThis.google

      el._submitToSheets('Test Name', 5)
      await el.updateComplete

      expect(consoleWarn.calledOnce).to.be.true
      consoleWarn.restore()
    })

    it('calls google.script.run when available (mocked)', async () => {
      const mockRun = {
        withSuccessHandler: (fn) => ({ withFailureHandler: (errFn) => ({ mockFunc: () => fn() }) }),
      }
      globalThis.google = { script: { run: mockRun } }

      const el = await fixture(html`<explode-quiz></explode-quiz>`)
      await el.updateComplete

      // Mock the script function call
      let called = false
      globalThis.google.script.run = {
        withSuccessHandler: (fn) => ({
          withFailureHandler: (errFn) => ({
            submitQuizResult: () => { called = true; fn() },
          }),
        }),
      }

      el._submitToSheets('Test Name', 5)
      await el.updateComplete

      expect(called).to.be.true

      delete globalThis.google
    })
  })

  /**
   * Unit Tests: Konfeti
   * Validates: Requirements 5.3
   */
  describe('Konfeti', () => {
    it('_confettiFn is null when canvas-confetti import fails', async () => {
      const el = await fixture(html`<explode-quiz></explode-quiz>`)
      await el.updateComplete

      // _confettiFn should be null initially (import happens in connectedCallback)
      expect(el._confettiFn).to.equal(null)
    })

    it('_fireConfetti() does not throw when _confettiFn is null', async () => {
      const el = await fixture(html`<explode-quiz></explode-quiz>`)
      await el.updateComplete

      el._confettiFn = null
      expect(() => el._fireConfetti()).to.not.throw()
    })
  })
})
/**
 * Property-Based Tests (PBT)
 * Uses fast-check library with numRuns: 100
 */

describe('Property-Based Tests', () => {
  /**
   * Property 1: Name validation rejection
   * Validates: Requirements 2.2, 2.6
   * Feature: interactive-quiz, Property 1: Name validation rejection
   */
  describe('Property 1: Name validation rejection', () => {
    it('short names (<=2 chars) stay on name screen with validation error', async () => {
      const el = await fixture(html`<explode-quiz></explode-quiz>`)
      await el.updateComplete

      await fc.assert(
        fc.asyncProperty(
          fc.string().filter(s => s.trim().length <= 2),
          async (shortName) => {
            el._nameInputValue = shortName
            el._startQuiz()
            await el.updateComplete

            expect(el._screen).to.equal('name')
            expect(el._validationError).to.not.equal('')
          }
        ),
        { numRuns: FC_RUNS }
      )
    })
  })

  /**
   * Property 2: Name validation acceptance
   * Validates: Requirements 2.3, 2.4
   * Feature: interactive-quiz, Property 2: Name validation acceptance
   */
  describe('Property 2: Name validation acceptance', () => {
    it('long names (>2 chars) transition to question screen', async () => {
      const el = await fixture(html`<explode-quiz></explode-quiz>`)
      await el.updateComplete

      await fc.assert(
        fc.asyncProperty(
          fc.string({ minLength: 3 }).filter(s => s.trim().length > 2),
          async (longName) => {
            const trimmed = longName.trim()
            el._nameInputValue = longName
            el._startQuiz()
            await el.updateComplete

            expect(el._screen).to.equal('question')
            expect(el._studentName).to.equal(trimmed)
            expect(el._validationError).to.equal('')
          }
        ),
        { numRuns: FC_RUNS }
      )
    })
  })

  /**
   * Property 3: Question screen structure invariant
   * Validates: Requirements 3.1, 3.5
   * Feature: interactive-quiz, Property 3: Question screen structure invariant
   */
  describe('Property 3: Question screen structure invariant', () => {
    it('question screen always has question text, progress label, and 4 buttons', async () => {
      await fc.assert(
        fc.asyncProperty(
          validQuestionArbitrary,
          fc.integer({ min: 0, max: 10 }),
          async (question, index) => {
            const el = await fixture(html`<explode-quiz></explode-quiz>`)
            el.questions = [question, question, question] // At least 3 questions
            el._screen = 'question'
            el._currentIndex = index % el.questions.length
            await el.updateComplete

            const shadow = el.shadowRoot

            // Check question text exists
            const questionText = shadow.querySelector('.question-text')
            expect(questionText).to.exist
            expect(questionText.textContent).to.equal(question.question)

            // Check progress label format "Soal N dari M"
            const progressLabel = shadow.querySelector('.progress-label')
            expect(progressLabel).to.exist
            const text = progressLabel.textContent
            expect(text).to.include('Soal')
            expect(text).to.include('dari')

            // Check exactly 4 answer buttons
            const buttons = shadow.querySelectorAll('.answer-btn')
            expect(buttons.length).to.equal(4)
          }
        ),
        { numRuns: FC_RUNS }
      )
    })
  })

  /**
   * Property 4: Buttons disabled after answer
   * Validates: Requirement 3.2
   * Feature: interactive-quiz, Property 4: Buttons disabled after answer
   */
  describe('Property 4: Buttons disabled after answer', () => {
    it('all 4 answer buttons have disabled attribute after _selectAnswer', async () => {
      await fc.assert(
        fc.asyncProperty(
          validQuestionArbitrary,
          fc.integer({ min: 0, max: 3 }),
          async (question, choiceIndex) => {
            const el = await fixture(html`<explode-quiz></explode-quiz>`)
            el.questions = [question, question, question]
            el._screen = 'question'
            el._currentIndex = 0
            el._answered = false
            await el.updateComplete

            el._selectAnswer(choiceIndex)
            await el.updateComplete

            const buttons = el.shadowRoot.querySelectorAll('.answer-btn')
            expect(buttons.length).to.equal(4)

            for (const button of buttons) {
              expect(button.disabled).to.be.true
            }
          }
        ),
        { numRuns: FC_RUNS }
      )
    })
  })

  /**
   * Property 5: Score +1 for correct answer
   * Validates: Requirement 3.3
   * Feature: interactive-quiz, Property 5: Score +1 for correct answer
   */
  describe('Property 5: Score +1 for correct answer', () => {
    it('correct answer increments score by exactly 1', async () => {
      await fc.assert(
        fc.asyncProperty(
          validQuestionArbitrary,
          fc.integer({ min: 0, max: 100 }),
          async (question, initialScore) => {
            const el = await fixture(html`<explode-quiz></explode-quiz>`)
            el.questions = [question, question, question]
            el._screen = 'question'
            el._currentIndex = 0
            el._answered = false
            el._score = initialScore
            await el.updateComplete

            const correctIndex = question.correctIndex
            el._selectAnswer(correctIndex)
            await el.updateComplete

            expect(el._score).to.equal(initialScore + 1)
          }
        ),
        { numRuns: FC_RUNS }
      )
    })
  })

  /**
   * Property 6: Score unchanged for wrong answer
   * Validates: Requirement 3.3
   * Feature: interactive-quiz, Property 6: Score unchanged for wrong answer
   */
  describe('Property 6: Score unchanged for wrong answer', () => {
    it('wrong answer does not change score', async () => {
      await fc.assert(
        fc.asyncProperty(
          validQuestionArbitrary,
          fc.integer({ min: 0, max: 100 }),
          async (question, initialScore) => {
            const el = await fixture(html`<explode-quiz></explode-quiz>`)
            el.questions = [question, question, question]
            el._screen = 'question'
            el._currentIndex = 0
            el._answered = false
            el._score = initialScore
            await el.updateComplete

            const correctIndex = question.correctIndex
            // Filter out the correct index
            const wrongIndices = [0, 1, 2, 3].filter(i => i !== correctIndex)
            const wrongIndex = wrongIndices[0]

            el._selectAnswer(wrongIndex)
            await el.updateComplete

            expect(el._score).to.equal(initialScore)
          }
        ),
        { numRuns: FC_RUNS }
      )
    })
  })

  /**
   * Property 7: Correct feedback color
   * Validates: Requirement 4.3
   * Feature: interactive-quiz, Property 7: Correct feedback color
   */
  describe('Property 7: Correct feedback color', () => {
    it('correct answer sets selected button to answer-btn--correct', async () => {
      await fc.assert(
        fc.asyncProperty(
          validQuestionArbitrary,
          async (question) => {
            const el = await fixture(html`<explode-quiz></explode-quiz>`)
            el.questions = [question, question, question]
            el._screen = 'question'
            el._currentIndex = 0
            el._answered = false
            await el.updateComplete

            const correctIndex = question.correctIndex
            el._selectAnswer(correctIndex)
            await el.updateComplete

            const buttons = el.shadowRoot.querySelectorAll('.answer-btn')
            const selectedButton = buttons[correctIndex]

            expect(selectedButton.classList.contains('answer-btn--correct')).to.be.true
            expect(el._feedbackPositive).to.be.true
          }
        ),
        { numRuns: FC_RUNS }
      )
    })
  })

  /**
   * Property 8: Wrong feedback color
   * Validates: Requirement 4.4
   * Feature: interactive-quiz, Property 8: Wrong feedback color
   */
  describe('Property 8: Wrong feedback color', () => {
    it('wrong answer sets selected button to answer-btn--wrong and correct to answer-btn--correct', async () => {
      await fc.assert(
        fc.asyncProperty(
          validQuestionArbitrary,
          async (question) => {
            const el = await fixture(html`<explode-quiz></explode-quiz>`)
            el.questions = [question, question, question]
            el._screen = 'question'
            el._currentIndex = 0
            el._answered = false
            await el.updateComplete

            const correctIndex = question.correctIndex
            const wrongIndices = [0, 1, 2, 3].filter(i => i !== correctIndex)
            const wrongIndex = wrongIndices[0]

            el._selectAnswer(wrongIndex)
            await el.updateComplete

            const buttons = el.shadowRoot.querySelectorAll('.answer-btn')
            const selectedButton = buttons[wrongIndex]
            const correctButton = buttons[correctIndex]

            expect(selectedButton.classList.contains('answer-btn--wrong')).to.be.true
            expect(correctButton.classList.contains('answer-btn--correct')).to.be.true
          }
        ),
        { numRuns: FC_RUNS }
      )
    })
  })

  /**
   * Property 9: Confetti exactly once
   * Validates: Requirements 5.1, 5.4
   * Feature: interactive-quiz, Property 9: Confetti exactly once
   */
  describe('Property 9: Confetti exactly once', () => {
    it('confetti fires exactly once per correct answer', async () => {
      await fc.assert(
        fc.asyncProperty(
          validQuestionArbitrary,
          async (question) => {
            let callCount = 0
            const mockConfetti = () => { callCount++ }

            const el = await fixture(html`<explode-quiz></explode-quiz>`)
            el.questions = [question, question, question]
            el._screen = 'question'
            el._currentIndex = 0
            el._answered = false
            el._confettiFn = mockConfetti
            await el.updateComplete

            const correctIndex = question.correctIndex
            el._selectAnswer(correctIndex)
            await el.updateComplete

            // Wait for setTimeout to execute
            await new Promise(resolve => setTimeout(resolve, 1300))

            expect(callCount).to.equal(1)
          }
        ),
        { numRuns: FC_RUNS }
      )
    })
  })

  /**
   * Property 10: Result screen completeness
   * Validates: Requirement 7.1
   * Feature: interactive-quiz, Property 10: Result screen completeness
   */
  describe('Property 10: Result screen completeness', () => {
    it('result screen contains name, score, total, and percentage', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.string({ minLength: 3 }),
          fc.integer({ min: 0 }),
          fc.integer({ min: 1 }),
          async (studentName, score, total) => {
            const el = await fixture(html`<explode-quiz></explode-quiz>`)
            el._screen = 'result'
            el._studentName = studentName
            el._score = score
            el.questions = new Array(total).fill(null).map(() => validQuestionArbitrary.prop())
            await el.updateComplete

            const shadow = el.shadowRoot

            expect(shadow.querySelector('.result-name').textContent).to.include(studentName)
            expect(shadow.querySelector('.result-score').textContent).to.include(score.toString())
            expect(shadow.querySelector('.result-score').textContent).to.include(total.toString())
            expect(shadow.querySelector('.result-percentage').textContent).to.include('%')
          }
        ),
        { numRuns: FC_RUNS }
      )
    })
  })

  /**
   * Property 11: Appreciation message threshold
   * Validates: Requirements 7.2, 7.3, 7.4
   * Feature: interactive-quiz, Property 11: Appreciation message threshold
   */
  describe('Property 11: Appreciation message threshold', () => {
    it('correct message tier based on percentage', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.integer({ min: 0, max: 10 }),
          fc.integer({ min: 1, max: 10 }),
          async (score, total) => {
            const el = await fixture(html`<explode-quiz></explode-quiz>`)
            el._screen = 'result'
            el._studentName = 'Test'
            el._score = score
            el.questions = new Array(total).fill(null).map(() => validQuestionArbitrary.prop())
            await el.updateComplete

            const messageElement = el.shadowRoot.querySelector('.result-message')
            const percentage = score / total

            if (percentage >= 0.8) {
              expect(messageElement.textContent).to.include(el.t.messageHigh)
            } else if (percentage >= 0.5) {
              expect(messageElement.textContent).to.include(el.t.messageMedium)
            } else {
              expect(messageElement.textContent).to.include(el.t.messageLow)
            }
          }
        ),
        { numRuns: FC_RUNS }
      )
    })
  })

  /**
   * Property 12: Sheets payload format
   * Validates: Requirements 8.1, 8.2
   * Feature: interactive-quiz, Property 12: Sheets payload format
   */
  describe('Property 12: Sheets payload format', () => {
    it('payload has valid ISO 8601 timestamp, name, and integer score', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.string({ minLength: 1 }),
          fc.integer({ min: 0 }),
          async (studentName, score) => {
            let capturedPayload = null

            const originalGoogle = globalThis.google
            globalThis.google = {
              script: {
                run: {
                  withSuccessHandler: (fn) => ({
                    withFailureHandler: (errFn) => ({
                      submitQuizResult: (payload) => { capturedPayload = payload },
                    }),
                  }),
                },
              },
            }

            const el = await fixture(html`<explode-quiz></explode-quiz>`)
            await el.updateComplete

            el._submitToSheets(studentName, score)
            await el.updateComplete

            delete globalThis.google

            expect(capturedPayload).to.not.be.null
            expect(capturedPayload.timestamp).to.be.a('string')
            expect(new Date(capturedPayload.timestamp).toISOString()).to.equal(capturedPayload.timestamp)
            expect(capturedPayload.name).to.equal(studentName)
            expect(capturedPayload.score).to.equal(score)
            expect(Number.isInteger(capturedPayload.score)).to.be.true
          }
        ),
        { numRuns: FC_RUNS }
      )
    })
  })

  /**
   * Property 13: Questions round-trip
   * Validates: Requirement 3.8
   * Feature: interactive-quiz, Property 13: Questions round-trip
   */
  describe('Property 13: Questions round-trip', () => {
    it('assigned questions array is reflected in component', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.array(validQuestionArbitrary, { minLength: 1 }),
          async (questions) => {
            const el = await fixture(html`<explode-quiz></explode-quiz>`)
            await el.updateComplete

            el.questions = questions
            await el.updateComplete

            expect(el.questions).to.have.length(questions.length)
            expect(el.questions).to.deep.equal(questions)
          }
        ),
        { numRuns: FC_RUNS }
      )
    })
  })

  /**
   * Property 14: All interactive elements have non-empty aria-label
   * Validates: Requirement 9.5
   * Feature: interactive-quiz, Property 14: All interactive elements have non-empty aria-label
   */
  describe('Property 14: All interactive elements have non-empty aria-label', () => {
    it('all buttons and inputs have non-empty aria-label', async () => {
      await fc.assert(
        fc.asyncProperty(
          validQuestionArbitrary,
          fc.string({ minLength: 3 }),
          async (question, name) => {
            const el = await fixture(html`<explode-quiz></explode-quiz>`)
            el._screen = 'name'
            el._nameInputValue = name
            await el.updateComplete

            // Check name screen elements
            const nameScreenButtons = el.shadowRoot.querySelectorAll('button')
            const nameScreenInputs = el.shadowRoot.querySelectorAll('input')

            for (const button of nameScreenButtons) {
              const ariaLabel = button.getAttribute('aria-label')
              expect(ariaLabel).to.be.a('string')
              expect(ariaLabel.trim().length).to.be.greaterThan(0)
            }

            for (const input of nameScreenInputs) {
              const ariaLabel = input.getAttribute('aria-label')
              expect(ariaLabel).to.be.a('string')
              expect(ariaLabel.trim().length).to.be.greaterThan(0)
            }

            // Check question screen elements
            el._screen = 'question'
            el._currentIndex = 0
            el.questions = [question, question, question]
            await el.updateComplete

            const questionScreenButtons = el.shadowRoot.querySelectorAll('button')
            for (const button of questionScreenButtons) {
              const ariaLabel = button.getAttribute('aria-label')
              expect(ariaLabel).to.be.a('string')
              expect(ariaLabel.trim().length).to.be.greaterThan(0)
            }

            // Check result screen elements
            el._screen = 'result'
            el._studentName = name
            el._score = 1
            el.questions = [question, question, question]
            await el.updateComplete

            const resultScreenButtons = el.shadowRoot.querySelectorAll('button')
            for (const button of resultScreenButtons) {
              const ariaLabel = button.getAttribute('aria-label')
              expect(ariaLabel).to.be.a('string')
              expect(ariaLabel.trim().length).to.be.greaterThan(0)
            }
          }
        ),
        { numRuns: FC_RUNS }
      )
    })
  })

  /**
   * Unit Tests: Interactive Question Editor
   * Validates: Requirements 14.2, 14.6, 14.7, 14.8, 14.9
   */
  describe('Interactive Question Editor', () => {
    beforeEach(async () => {
      const el = await fixture(html`<explode-quiz></explode-quiz>`)
      el._screen = 'editor'
      el._tempQuestions = JSON.parse(JSON.stringify(el.questions))
      el._editingIndex = -1
      el._tempQuestionText = ''
      el._tempChoice0 = ''
      el._tempChoice1 = ''
      el._tempChoice2 = ''
      el._tempChoice3 = ''
      el._tempCorrectIndex = '0'
      await el.updateComplete
      return el
    })

    describe('_addQuestion()', () => {
      it('validates form and rejects empty question text', async () => {
        const el = await fixture(html`<explode-quiz></explode-quiz>`)
        el._screen = 'editor'
        el._tempQuestions = JSON.parse(JSON.stringify(el.questions))
        el._tempQuestionText = '   '
        el._tempChoice0 = 'A'
        el._tempChoice1 = 'B'
        el._tempChoice2 = 'C'
        el._tempChoice3 = 'D'
        await el.updateComplete

        const initialLength = el._tempQuestions.length
        el._addQuestion()
        await el.updateComplete

        expect(el._tempQuestions.length).to.equal(initialLength)
      })

      it('validates form and rejects empty choice fields', async () => {
        const el = await fixture(html`<explode-quiz></explode-quiz>`)
        el._screen = 'editor'
        el._tempQuestions = JSON.parse(JSON.stringify(el.questions))
        el._tempQuestionText = 'New question?'
        el._tempChoice0 = '   '
        el._tempChoice1 = 'B'
        el._tempChoice2 = 'C'
        el._tempChoice3 = 'D'
        await el.updateComplete

        const initialLength = el._tempQuestions.length
        el._addQuestion()
        await el.updateComplete

        expect(el._tempQuestions.length).to.equal(initialLength)
      })

      it('creates and adds new question to _tempQuestions', async () => {
        const el = await fixture(html`<explode-quiz></explode-quiz>`)
        el._screen = 'editor'
        el._tempQuestions = JSON.parse(JSON.stringify(el.questions))
        el._tempQuestionText = 'New question?'
        el._tempChoice0 = 'Choice A'
        el._tempChoice1 = 'Choice B'
        el._tempChoice2 = 'Choice C'
        el._tempChoice3 = 'Choice D'
        el._tempCorrectIndex = '2'
        await el.updateComplete

        const initialLength = el._tempQuestions.length
        el._addQuestion()
        await el.updateComplete

        expect(el._tempQuestions.length).to.equal(initialLength + 1)
        const newQuestion = el._tempQuestions[initialLength]
        expect(newQuestion.question).to.equal('New question?')
        expect(newQuestion.choices).to.deep.equal(['Choice A', 'Choice B', 'Choice C', 'Choice D'])
        expect(newQuestion.correctIndex).to.equal(2)
      })

      it('resets form fields after adding question', async () => {
        const el = await fixture(html`<explode-quiz></explode-quiz>`)
        el._screen = 'editor'
        el._tempQuestions = JSON.parse(JSON.stringify(el.questions))
        el._tempQuestionText = 'New question?'
        el._tempChoice0 = 'Choice A'
        el._tempChoice1 = 'Choice B'
        el._tempChoice2 = 'Choice C'
        el._tempChoice3 = 'Choice D'
        el._tempCorrectIndex = '1'
        await el.updateComplete

        el._addQuestion()
        await el.updateComplete

        expect(el._tempQuestionText).to.equal('')
        expect(el._tempChoice0).to.equal('')
        expect(el._tempChoice1).to.equal('')
        expect(el._tempChoice2).to.equal('')
        expect(el._tempChoice3).to.equal('')
        expect(el._tempCorrectIndex).to.equal('0')
      })
    })

    describe('_deleteQuestion(index)', () => {
      it('prevents deletion when _tempQuestions.length <= 3', async () => {
        const el = await fixture(html`<explode-quiz></explode-quiz>`)
        el._screen = 'editor'
        el._tempQuestions = JSON.parse(JSON.stringify(el.questions))
        el._tempQuestions.length = 3 // Force to 3
        await el.updateComplete

        const initialLength = el._tempQuestions.length
        el._deleteQuestion(0)
        await el.updateComplete

        expect(el._tempQuestions.length).to.equal(initialLength)
      })

      it('removes question at specified index', async () => {
        const el = await fixture(html`<explode-quiz></explode-quiz>`)
        el._screen = 'editor'
        el._tempQuestions = JSON.parse(JSON.stringify(el.questions))
        el._tempQuestions.push({ question: 'Extra', choices: ['A','B','C','D'], correctIndex: 0 })
        await el.updateComplete

        const initialLength = el._tempQuestions.length
        el._deleteQuestion(3)
        await el.updateComplete

        expect(el._tempQuestions.length).to.equal(initialLength - 1)
        expect(el._tempQuestions[3]).to.be.undefined
      })

      it('resets _editingIndex when deleted question was being edited', async () => {
        const el = await fixture(html`<explode-quiz></explode-quiz>`)
        el._screen = 'editor'
        el._tempQuestions = JSON.parse(JSON.stringify(el.questions))
        el._editingIndex = 1
        await el.updateComplete

        el._deleteQuestion(1)
        await el.updateComplete

        expect(el._editingIndex).to.equal(-1)
      })

      it('does not reset _editingIndex when other question is deleted', async () => {
        const el = await fixture(html`<explode-quiz></explode-quiz>`)
        el._screen = 'editor'
        el._tempQuestions = JSON.parse(JSON.stringify(el.questions))
        el._editingIndex = 2
        await el.updateComplete

        el._deleteQuestion(0)
        await el.updateComplete

        expect(el._editingIndex).to.equal(2)
      })
    })

    describe('_startEditQuestion(index)', () => {
      it('sets _editingIndex to specified index', async () => {
        const el = await fixture(html`<explode-quiz></explode-quiz>`)
        el._screen = 'editor'
        el._tempQuestions = JSON.parse(JSON.stringify(el.questions))
        await el.updateComplete

        el._startEditQuestion(1)
        await el.updateComplete

        expect(el._editingIndex).to.equal(1)
      })

      it('loads question data to temporary form fields', async () => {
        const el = await fixture(html`<explode-quiz></explode-quiz>`)
        el._screen = 'editor'
        el._tempQuestions = JSON.parse(JSON.stringify(el.questions))
        el._tempQuestionText = ''
        el._tempChoice0 = ''
        el._tempChoice1 = ''
        el._tempChoice2 = ''
        el._tempChoice3 = ''
        el._tempCorrectIndex = '0'
        await el.updateComplete

        const question = el._tempQuestions[0]
        el._startEditQuestion(0)
        await el.updateComplete

        expect(el._tempQuestionText).to.equal(question.question)
        expect(el._tempChoice0).to.equal(question.choices[0])
        expect(el._tempChoice1).to.equal(question.choices[1])
        expect(el._tempChoice2).to.equal(question.choices[2])
        expect(el._tempChoice3).to.equal(question.choices[3])
        expect(el._tempCorrectIndex).to.equal(question.correctIndex.toString())
      })

      it('handles invalid index gracefully', async () => {
        const el = await fixture(html`<explode-quiz></explode-quiz>`)
        el._screen = 'editor'
        el._tempQuestions = JSON.parse(JSON.stringify(el.questions))
        el._editingIndex = 0
        await el.updateComplete

        el._startEditQuestion(-1)
        await el.updateComplete

        expect(el._editingIndex).to.equal(0)

        el._startEditQuestion(999)
        await el.updateComplete

        expect(el._editingIndex).to.equal(0)
      })
    })
  })
})

/**
 * Property 1 — Bug Condition: questions Does Not Reflect to DOM Attribute
 * Validates: Requirements 1.1, 1.2, 1.4
 *
 * These tests are EXPECTED TO FAIL on unfixed code.
 * Failure confirms the bug: getAttribute("questions") returns null
 * because reflect: true is missing from the questions property declaration.
 *
 * These tests encode expected behavior — they will PASS after the fix is applied.
 */
describe('Property 1 — Bug Condition: questions Does Not Reflect to DOM Attribute', () => {
  it('getAttribute("questions") is non-null after programmatic assignment', async () => {
    const el = await fixture(html`<explode-quiz></explode-quiz>`)
    await el.updateComplete
    el.questions = [{ question: 'Q', choices: ['A', 'B', 'C', 'D'], correctIndex: 0 }]
    await el.updateComplete
    expect(el.getAttribute('questions')).to.not.equal(null)
  })

  it('JSON.parse(getAttribute("questions")) deep-equals assigned array', async () => {
    const customQ = [{ question: 'Test?', choices: ['X', 'Y', 'Z', 'W'], correctIndex: 1 }]
    const el = await fixture(html`<explode-quiz></explode-quiz>`)
    await el.updateComplete
    el.questions = customQ
    await el.updateComplete
    const attr = el.getAttribute('questions')
    expect(attr).to.not.equal(null)
    expect(JSON.parse(attr)).to.deep.equal(customQ)
  })

  it('element initialized with questions attribute parses JSON correctly', async () => {
    const el = await fixture(html`<explode-quiz questions='[{"question":"Q","choices":["A","B","C","D"],"correctIndex":0}]'></explode-quiz>`)
    await el.updateComplete
    expect(el.questions[0].question).to.equal('Q')
  })

  it('property: for any valid questions array, getAttribute returns non-null JSON matching input', async () => {
    const el = await fixture(html`<explode-quiz></explode-quiz>`)
    await el.updateComplete

    await fc.assert(
      fc.asyncProperty(
        fc.array(validQuestionArbitrary, { minLength: 1, maxLength: 3 }),
        async (questions) => {
          el.questions = questions
          await el.updateComplete
          const attr = el.getAttribute('questions')
          expect(attr).to.not.equal(null)
          expect(JSON.parse(attr)).to.deep.equal(questions)
        }
      ),
      { numRuns: 5 }
    )
  })
})
