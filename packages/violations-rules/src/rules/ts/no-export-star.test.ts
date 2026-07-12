import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { writeFile, mkdtemp, rm } from 'node:fs/promises'
import { join } from 'node:path'
import { tmpdir } from 'node:os'
import { rule } from './no-export-star.js'

describe('ts/no-export-star', () => {
  it('fires on export * from', async () => {
    const dir = await mkdtemp(join(tmpdir(), 'no-export-star-'))
    try {
      const file = join(dir, 'test.ts')
      await writeFile(file, "export * from './other'\n")
      const violations = await rule.check([file], {})
      assert.equal(violations.length, 1)
      assert.equal(violations[0].line, 1)
      assert.match(violations[0].message, /use explicit named exports/)
    } finally {
      await rm(dir, { recursive: true })
    }
  })

  it('does not fire on named exports', async () => {
    const dir = await mkdtemp(join(tmpdir(), 'no-export-star-'))
    try {
      const file = join(dir, 'test.ts')
      await writeFile(file, "export { Foo } from './other'\n")
      const violations = await rule.check([file], {})
      assert.equal(violations.length, 0)
    } finally {
      await rm(dir, { recursive: true })
    }
  })
})
