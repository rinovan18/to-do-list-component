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
          fc.string({ minLength: 3, maxLength: 50 }).filter(s => s.trim().length >= 3 && s.trim().length <= 50),
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

  /**
   * Property 4: Input Cleared After Addition
   * Validates: Requirements 3.3
   *
   * For any valid (non-whitespace) input string, after _addTask() successfully
   * adds a task, the value of shadowRoot.querySelector('#task-input') must be
   * an empty string ''.
   */
  describe('Property 4: Input Cleared After Addition', () => {
    it('input field is cleared to empty string after a task is successfully added', async () => {
      const el = await fixture(html`<todo-list></todo-list>`)
      await el.updateComplete

      await fc.assert(
        fc.asyncProperty(
          fc.string({ minLength: 3, maxLength: 50 }).filter(s => s.trim().length >= 3 && s.trim().length <= 50),
          async (text) => {
            // Reset tasks before each iteration
            el.tasks = []
            await el.updateComplete

            // Set input value and call _addTask() directly
            const input = el.shadowRoot.querySelector('#task-input')
            input.value = text
            el._addTask()
            await el.updateComplete

            // Input field must be cleared after successful task addition
            expect(el.shadowRoot.querySelector('#task-input').value).to.equal('')
          }
        ),
        { numRuns: FC_RUNS }
      )
    })
  })

  /**
   * Property 5: Task Deletion Removes Exactly One Task
   * Validates: Requirements 4.2
   *
   * For any array tasks with length N and any task in the array, deleting that
   * task by its id must produce a new tasks array with length N - 1 and no
   * element with the same id as the deleted task.
   */
  describe('Property 5: Task Deletion Removes Exactly One Task', () => {
    it('deleting a task reduces tasks.length by exactly 1 and removes the id', async () => {
      const validTaskArbitrary = fc.record({
        id: fc.uuid(),
        text: fc.string({ minLength: 1 }).filter(s => s.trim() !== ''),
        completed: fc.boolean(),
      })

      await fc.assert(
        fc.asyncProperty(
          fc.array(validTaskArbitrary, { minLength: 1, maxLength: 20 }).chain(
            arr => fc.tuple(fc.constant(arr), fc.integer({ min: 0, max: arr.length - 1 }))
          ),
          async ([tasks, index]) => {
            const el = await fixture(html`<todo-list></todo-list>`)
            el.tasks = tasks
            await el.updateComplete

            const targetTask = el.tasks[index]
            const lengthBefore = el.tasks.length

            el._handleDelete(targetTask.id)
            await el.updateComplete

            // Length must drop by exactly 1
            expect(el.tasks).to.have.length(lengthBefore - 1)
            // No task with the deleted id may remain
            expect(el.tasks.every(t => t.id !== targetTask.id)).to.equal(true)
          }
        ),
        { numRuns: FC_RUNS }
      )
    })
  })

  /**
   * Property 6: Complete Toggle Round-Trip
   * Validates: Requirements 5.2, 5.3
   *
   * For any task in the list, activating the Complete Toggle (completed: false → true)
   * then deactivating it (completed: true → false) must return the task's `completed`
   * value to its initial state (false). More generally: the `completed` value must
   * always reflect the last state set by the user.
   */
  describe('Property 6: Complete Toggle Round-Trip', () => {
    it('toggling completed true then false returns to false (round-trip invariant)', async () => {
      const validTaskArbitrary = fc.record({
        id: fc.uuid(),
        text: fc.string({ minLength: 1 }).filter(s => s.trim() !== ''),
        completed: fc.constant(false),
      })

      await fc.assert(
        fc.asyncProperty(
          fc.array(validTaskArbitrary, { minLength: 1, maxLength: 20 }).chain(
            arr => fc.tuple(fc.constant(arr), fc.integer({ min: 0, max: arr.length - 1 }))
          ),
          async ([tasks, index]) => {
            const el = await fixture(html`<todo-list></todo-list>`)
            el.tasks = tasks.map(t => ({ ...t }))
            await el.updateComplete

            const targetId = el.tasks[index].id

            // Step 1: toggle to true (completed: false → true)
            el._handleToggleComplete(targetId, true)
            await el.updateComplete

            const afterTrue = el.tasks.find(t => t.id === targetId)
            expect(afterTrue.completed).to.equal(true)

            // Step 2: toggle back to false (completed: true → false)
            el._handleToggleComplete(targetId, false)
            await el.updateComplete

            const afterFalse = el.tasks.find(t => t.id === targetId)
            expect(afterFalse.completed).to.equal(false)

            // Verify other tasks are not affected
            el.tasks.forEach(t => {
              if (t.id !== targetId) {
                const original = tasks.find(orig => orig.id === t.id)
                expect(t.completed).to.equal(original.completed)
              }
            })
          }
        ),
        { numRuns: FC_RUNS }
      )
    })

    it('setting completed to any boolean value v results in completed === v (last-set-wins)', async () => {
      const validTaskArbitrary = fc.record({
        id: fc.uuid(),
        text: fc.string({ minLength: 1 }).filter(s => s.trim() !== ''),
        completed: fc.boolean(),
      })

      await fc.assert(
        fc.asyncProperty(
          fc.array(validTaskArbitrary, { minLength: 1, maxLength: 20 }).chain(
            arr => fc.tuple(fc.constant(arr), fc.integer({ min: 0, max: arr.length - 1 }))
          ),
          fc.boolean(),
          async ([tasks, index], boolValue) => {
            const el = await fixture(html`<todo-list></todo-list>`)
            el.tasks = tasks.map(t => ({ ...t }))
            await el.updateComplete

            const targetId = el.tasks[index].id

            // Set completed to any boolean value
            el._handleToggleComplete(targetId, boolValue)
            await el.updateComplete

            const updatedTask = el.tasks.find(t => t.id === targetId)
            expect(updatedTask.completed).to.equal(boolValue)
          }
        ),
        { numRuns: FC_RUNS }
      )
    })
  })

  /**
   * Property 3: Task Addition Increases List Length
   * Validates: Requirements 3.2, 6.1, 6.3
   *
   * For any initial tasks array of length N and a valid non-empty input string,
   * after calling _addTask(), tasks.length must equal N + 1 and the last task
   * must have text equal to the trimmed input.
   */
  describe('Property 3: Task Addition Increases List Length', () => {
    it('adding a valid task increases tasks.length by exactly 1 and appends with correct text', async () => {
      const el = await fixture(html`<todo-list></todo-list>`)
      await el.updateComplete

      // Arbitrary for a valid task object (pre-existing tasks in the list)
      const validTaskArbitrary = fc.record({
        id: fc.string({ minLength: 1 }),
        text: fc.string({ minLength: 1 }).filter(s => s.trim() !== ''),
        completed: fc.boolean(),
      })

      await fc.assert(
        fc.asyncProperty(
          fc.array(validTaskArbitrary, { maxLength: 20 }),
          fc.string({ minLength: 3, maxLength: 50 }).filter(s => s.trim().length >= 3 && s.trim().length <= 50),
          async (initialTasks, newText) => {
            // Set up initial state with N tasks
            el.tasks = [...initialTasks]
            await el.updateComplete

            const N = el.tasks.length

            // Add a new task via _addTask()
            const input = el.shadowRoot.querySelector('#task-input')
            input.value = newText
            el._addTask()
            await el.updateComplete

            // tasks.length must be N + 1
            expect(el.tasks).to.have.length(N + 1)
            // The last task must have the correct trimmed text
            const lastTask = el.tasks[el.tasks.length - 1]
            expect(lastTask.text).to.equal(newText.trim())
          }
        ),
        { numRuns: FC_RUNS }
      )
    })
  })
})
