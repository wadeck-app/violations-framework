import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { writeFile, mkdtemp, rm } from 'node:fs/promises'
import { join } from 'node:path'
import { tmpdir } from 'node:os'
import { rule } from './no-debug-log.js'

describe('unity/no-debug-log', () => {
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

  it('fires on Debug.Log', async () => {
    const violations = await check('Debug.Log("hello");\n')
    assert.equal(violations.length, 1)
    assert.equal(violations[0].line, 1)
  })

  it('fires on Debug.LogWarning', async () => {
    const violations = await check('Debug.LogWarning("warn");\n')
    assert.equal(violations.length, 1)
  })

  it('fires on Debug.LogError', async () => {
    const violations = await check('Debug.LogError("err");\n')
    assert.equal(violations.length, 1)
  })

  it('does not fire on // Debug.Log comment', async () => {
    const violations = await check('// Debug.Log("hello");\n')
    assert.equal(violations.length, 0)
  })

  it('does not fire on * Debug.Log (block comment body)', async () => {
    const violations = await check('* Debug.Log("hello");\n')
    assert.equal(violations.length, 0)
  })
})
