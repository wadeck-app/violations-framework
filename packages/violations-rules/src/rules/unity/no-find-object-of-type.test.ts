import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { writeFile, mkdtemp, rm } from 'node:fs/promises'
import { join } from 'node:path'
import { tmpdir } from 'node:os'
import { rule } from './no-find-object-of-type.js'

describe('unity/no-find-object-of-type', () => {
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

  it('fires on FindObjectOfType in regular MonoBehaviour', async () => {
    const violations = await check('public class Foo : MonoBehaviour {\n  void Start() { FindObjectOfType<MyComp>(); }\n}\n')
    assert.equal(violations.length, 1)
  })

  it('does not fire when class inherits ScriptableObject', async () => {
    const violations = await check('public class Foo : ScriptableObject {\n  void Init() { FindObjectOfType<MyComp>(); }\n}\n')
    assert.equal(violations.length, 0)
  })

  it('does not fire on commented FindObjectOfType', async () => {
    const violations = await check('// FindObjectOfType<MyComp>();\n')
    assert.equal(violations.length, 0)
  })
})
