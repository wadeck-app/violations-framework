import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { writeFile, mkdtemp, rm } from 'node:fs/promises'
import { join } from 'node:path'
import { tmpdir } from 'node:os'
import { rule } from './no-string-split.js'

describe('unity/no-string-split', () => {
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

  it('fires on text.Split(",")', async () => {
    const violations = await check('var parts = text.Split(\',\');\n')
    assert.equal(violations.length, 1)
    assert.equal(violations[0].line, 1)
  })

  it('does not fire on StringHelper.Split', async () => {
    const violations = await check('var parts = StringHelper.Split(text, \',\');\n')
    assert.equal(violations.length, 0)
  })

  it('does not fire on commented .Split(', async () => {
    const violations = await check('// text.Split(\',\')\n')
    assert.equal(violations.length, 0)
  })
})
