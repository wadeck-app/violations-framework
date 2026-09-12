import { describe, it } from 'node:test'
import assert from 'node:assert/strict'

describe('tmp-passing-test', () => {
  it('passes', () => {
    assert.strictEqual(1, 1)
  })
})
