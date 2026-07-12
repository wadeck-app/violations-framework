import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { writeFile, mkdtemp, rm } from 'node:fs/promises'
import { join } from 'node:path'
import { tmpdir } from 'node:os'
import { rule } from './no-switch-default-break.js'

describe('ts/no-switch-default-break', () => {
  it('fires on single-line default: break;', async () => {
    const dir = await mkdtemp(join(tmpdir(), 'no-switch-default-'))
    try {
      const file = join(dir, 'test.ts')
      await writeFile(file, 'switch (x) {\n  default: break;\n}\n')
      const violations = await rule.check([file], {})
      assert.equal(violations.length, 1)
      assert.match(violations[0].message, /throw an error/)
    } finally {
      await rm(dir, { recursive: true })
    }
  })

  it('fires on multiline default: followed by break;', async () => {
    const dir = await mkdtemp(join(tmpdir(), 'no-switch-default-'))
    try {
      const file = join(dir, 'test.ts')
      await writeFile(file, 'switch (x) {\n  default:\n    break;\n}\n')
      const violations = await rule.check([file], {})
      assert.equal(violations.length, 1)
    } finally {
      await rm(dir, { recursive: true })
    }
  })

  it('does not fire when default throws', async () => {
    const dir = await mkdtemp(join(tmpdir(), 'no-switch-default-'))
    try {
      const file = join(dir, 'test.ts')
      await writeFile(file, "switch (x) {\n  default:\n    throw new Error('unknown')\n}\n")
      const violations = await rule.check([file], {})
      assert.equal(violations.length, 0)
    } finally {
      await rm(dir, { recursive: true })
    }
  })

  it('does not fire on comment lines containing default:', async () => {
    const dir = await mkdtemp(join(tmpdir(), 'no-switch-default-'))
    try {
      const file = join(dir, 'test.ts')
      await writeFile(file, '// default: break;\n')
      const violations = await rule.check([file], {})
      assert.equal(violations.length, 0)
    } finally {
      await rm(dir, { recursive: true })
    }
  })
})
