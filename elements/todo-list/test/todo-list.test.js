import { fixture, html, expect } from '@open-wc/testing'
import '../todo-list.js'

// Placeholder test file — full tests are implemented in later tasks (8.1, 8.2)
describe('todo-list', () => {
  it('is defined', async () => {
    const el = await fixture(html`<todo-list></todo-list>`)
    expect(el).to.exist
  })
})
