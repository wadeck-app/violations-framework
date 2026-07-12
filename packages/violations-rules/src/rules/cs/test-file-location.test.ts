import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { rule } from './test-file-location.js'

describe('cs/test-file-location', () => {
  it('fires when Test_*.cs is not under _tests/', async () => {
    const violations = await rule.check(['/project/Assets/UnitTests/Test_Foo.cs'], {})
    assert.equal(violations.length, 1)
    assert.equal(violations[0].line, 1)
  })

  it('does not fire when Test_*.cs is under _tests/', async () => {
    const violations = await rule.check(['/project/Assets/UnitTests/_tests/Test_Foo.cs'], {})
    assert.equal(violations.length, 0)
  })

  it('does not fire for non-test files', async () => {
    const violations = await rule.check(['/project/Assets/Scripts/FooManager.cs'], {})
    assert.equal(violations.length, 0)
  })
})
