import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { writeFile, mkdtemp, rm } from 'node:fs/promises'
import { join } from 'node:path'
import { tmpdir } from 'node:os'
import { rule } from './listener-register-symmetry.js'

describe('unity/listener-register-symmetry', () => {
  async function check(code: string) {
    const dir = await mkdtemp(join(tmpdir(), 'test-'))
    try {
      const file = join(dir, 'Foo.cs')
      await writeFile(file, code)
      return rule.check([file], {})
    } finally {
      await rm(dir, { recursive: true })
    }
  }

  it('fires when Register exists but no Unregister', async () => {
    const violations = await check('listener.Register(handler);\n')
    assert.equal(violations.length, 1)
    assert.equal(violations[0].line, 1)
  })

  it('does not fire when both Register and Unregister exist', async () => {
    const violations = await check('listener.Register(handler);\nlistener.Unregister(handler);\n')
    assert.equal(violations.length, 0)
  })

  it('does not fire when no Register calls', async () => {
    const violations = await check('doSomething();\n')
    assert.equal(violations.length, 0)
  })

  it('does not fire when Register and UnregisterIfSet exist', async () => {
    const violations = await check('listener.Register(handler);\nUnregisterIfSet(listener);\n')
    assert.equal(violations.length, 0)
  })
})
