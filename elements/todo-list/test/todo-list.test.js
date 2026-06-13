import { fixture, html, expect } from '@open-wc/testing'
import fc from 'fast-check'
import '../todo-list.js'

const FC_RUNS = 100

describe('todo-list', () => {
  it('is defined', async () => {
    const el = await fixture(html`<todo-list></todo-list>`)
    expect(el).to.exist
  })

  /**
   * Property 2: Whitespace Input Rejection
   * Validates: Requirements 3.5
   *
   * For any string consisting entirely of whitespace characters (space, tab, newline,
   * or any combination), attempting to add it as a task must not change the length
   * or contents of the `tasks` array.
   */
  describe('Property 2: Whitespace Input Rejection', () => {
    it('whitespace-only strings never add a task', async () => {
      const el = await fixture(html`<todo-list></todo-list>`)
      await el.updateComplete

      await fc.assert(
        fc.asyncProperty(
          fc.array(fc.constantFrom(' ', '\t', '\n')).map(chars => chars.join('')),
          async (whitespace) => {
            // Reset tasks before each iteration
            el.tasks = []
            await el.updateComplete

            // Set input value to whitespace string and call _addTask() directly
            const input = el.shadowRoot.querySelector('#task-input')
            input.value = whitespace
            el._addTask()
            await el.updateComplete

            // tasks.length must remain unchanged (0)
            expect(el.tasks).to.have.length(0)
          }
        ),
        { numRuns: FC_RUNS }
      )
    })
  })

  /**
   * Property 1: Task Object Schema Invariant
   * Validates: Requirements 2.4, 3.2
   *
   * For any non-empty task text added to TodoList, the resulting Task object
   * stored in the `tasks` array must have:
   *   - `id`: non-empty string
   *   - `text`: equal to the trimmed input
   *   - `completed`: false
   */
  describe('Property 1: Task Object Schema Invariant', () => {
    it('task objects always have valid id, trimmed text, and completed=false', async () => {
      const el = await fixture(html`<todo-list></todo-list>`)
      await el.updateComplete

      await fc.assert(
        fc.asyncProperty(
          fc.string({ minLength: 1 }).filter(s => s.trim() !== ''),
          async (text) => {
            // Reset tasks before each iteration
            el.tasks = []
            await el.updateComplete

            // Set input value and call _addTask() directly
            const input = el.shadowRoot.querySelector('#task-input')
            input.value = text
            el._addTask()
            await el.updateComplete

            // Verify the resulting task object schema
            expect(el.tasks).to.have.length(1)
            const task = el.tasks[0]
            expect(task.id).to.be.a('string')
            expect(task.id).to.not.equal('')
            expect(task.text).to.equal(text.trim())
            expect(task.completed).to.equal(false)
          }
        ),
        { numRuns: FC_RUNS }
      )
    })
  })
})
