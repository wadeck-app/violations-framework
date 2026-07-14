import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { writeFile, mkdtemp, rm } from 'node:fs/promises'
import { join } from 'node:path'
import { tmpdir } from 'node:os'
import { rule } from './no-instantiate-world-rotation.js'

describe('unity/no-instantiate-world-rotation', () => {
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

  it('fires on Instantiate with Quaternion.identity as rotation', async () => {
    const violations = await check('var go = Instantiate(prefab, pos, Quaternion.identity, parent);\n')
    assert.equal(violations.length, 1)
    assert.equal(violations[0].line, 1)
  })

  it('does not fire on Instantiate without Quaternion.identity', async () => {
    const violations = await check('var go = Instantiate(prefab, parent, false);\n')
    assert.equal(violations.length, 0)
  })

  it('does not fire on Instantiate(prefab, Quaternion.identity) two-arg without parent', async () => {
    // Two-arg overload: no trailing comma after Quaternion.identity
    const violations = await check('var go = Instantiate(prefab, Quaternion.identity);\n')
    assert.equal(violations.length, 0)
  })

  it('does not fire on // comment', async () => {
    const violations = await check('// Instantiate(prefab, pos, Quaternion.identity, parent);\n')
    assert.equal(violations.length, 0)
  })
})
