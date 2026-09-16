import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { writeFile, mkdtemp, rm } from 'node:fs/promises'
import { join } from 'node:path'
import { tmpdir } from 'node:os'
import { rule } from './no-inline-if-body.js'

async function withTmp(name: string, fn: (dir: string) => Promise<void>): Promise<void> {
  const dir = await mkdtemp(join(tmpdir(), `no-inline-if-${name}-`))
  try { await fn(dir) } finally { await rm(dir, { recursive: true }) }
}

describe('ts/no-inline-if-body', () => {

  it('flags inline if without braces (single line, nested parens)', async () => {
    await withTmp('nested', async (dir) => {
      const file = join(dir, 'test.ts')
      await writeFile(file, 'if (typeof line.prefix !== "string" || !line.prefix.startsWith(prefix)) continue;\n')
      const violations = await rule.check([file], {})
      assert.equal(violations.length, 1)
      assert.equal(violations[0].line, 1)
      assert.match(violations[0].message, /braces/)
    })
  })

  it('flags inline if without braces (simple return)', async () => {
    await withTmp('return', async (dir) => {
      const file = join(dir, 'test.ts')
      await writeFile(file, 'if (!value) return;\n')
      const violations = await rule.check([file], {})
      assert.equal(violations.length, 1)
    })
  })

  it('flags if body on next line without braces', async () => {
    await withTmp('nextline', async (dir) => {
      const file = join(dir, 'test.ts')
      await writeFile(file, 'if (x)\n  doSomething();\n')
      const violations = await rule.check([file], {})
      assert.equal(violations.length, 1)
      assert.equal(violations[0].line, 1)
    })
  })

  it('flags else if inline without braces', async () => {
    await withTmp('elseif', async (dir) => {
      const file = join(dir, 'test.ts')
      await writeFile(file, 'if (a) {\n  x()\n} else if (b) doThat();\n')
      const violations = await rule.check([file], {})
      assert.equal(violations.length, 1)
      assert.equal(violations[0].line, 3)
    })
  })

  it('does not flag if with braces (multi-line)', async () => {
    await withTmp('ok-braces', async (dir) => {
      const file = join(dir, 'test.ts')
      await writeFile(file, 'if (!value) {\n  return;\n}\n')
      const violations = await rule.check([file], {})
      assert.equal(violations.length, 0)
    })
  })

  it('does not flag if condition spanning multiple lines', async () => {
    await withTmp('multiline-cond', async (dir) => {
      const file = join(dir, 'test.ts')
      await writeFile(file, 'if (\n  longCondition\n) {\n  doIt();\n}\n')
      const violations = await rule.check([file], {})
      assert.equal(violations.length, 0)
    })
  })

  it('does not flag comment lines containing if', async () => {
    await withTmp('comment', async (dir) => {
      const file = join(dir, 'test.ts')
      await writeFile(file, '// if (x) doSomething();\n')
      const violations = await rule.check([file], {})
      assert.equal(violations.length, 0)
    })
  })

  it('returns empty array for empty files list', async () => {
    const violations = await rule.check([], {})
    assert.equal(violations.length, 0)
  })

})
