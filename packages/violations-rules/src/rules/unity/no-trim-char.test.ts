import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { writeFile, mkdtemp, rm } from 'node:fs/promises'
import { join } from 'node:path'
import { tmpdir } from 'node:os'
import { rule } from './no-trim-char.js'

describe('unity/no-trim-char', () => {
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

  it("fires on str.TrimEnd('/')", async () => {
    const violations = await check("str.TrimEnd('/');\n")
    assert.equal(violations.length, 1)
    assert.equal(violations[0].line, 1)
  })

  it('does not fire on safe new char[] form', async () => {
    const violations = await check("str.TrimEnd(new char[] { '/' });\n")
    assert.equal(violations.length, 0)
  })

  it('does not fire on commented TrimEnd', async () => {
    const violations = await check("// str.TrimEnd('/');\n")
    assert.equal(violations.length, 0)
  })
})
