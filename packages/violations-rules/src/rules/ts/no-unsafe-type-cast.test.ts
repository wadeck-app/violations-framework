import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { writeFile, mkdtemp, rm } from 'node:fs/promises'
import { join } from 'node:path'
import { tmpdir } from 'node:os'
import { rule } from './no-unsafe-type-cast.js'

describe('ts/no-unsafe-type-cast', () => {
  it('fires on cast to unknown', async () => {
    const dir = await mkdtemp(join(tmpdir(), 'no-unsafe-type-cast-'))
    try {
      const file = join(dir, 'test.ts')
      await writeFile(file, 'const x = foo as unknown;\n')
      const violations = await rule.check([file], {})
      assert.equal(violations.length, 1)
      assert.equal(violations[0].line, 1)
      assert.match(violations[0].message, /Unsafe cast/)
    } finally {
      await rm(dir, { recursive: true })
    }
  })

  it('fires on cast to any', async () => {
    const dir = await mkdtemp(join(tmpdir(), 'no-unsafe-type-cast-'))
    try {
      const file = join(dir, 'test.ts')
      await writeFile(file, 'const x = foo as any\n')
      const violations = await rule.check([file], {})
      assert.equal(violations.length, 1)
    } finally {
      await rm(dir, { recursive: true })
    }
  })

  it('fires on cast to Record<string, unknown>', async () => {
    const dir = await mkdtemp(join(tmpdir(), 'no-unsafe-type-cast-'))
    try {
      const file = join(dir, 'test.ts')
      await writeFile(file, 'return foo as Record<string, unknown>\n')
      const violations = await rule.check([file], {})
      assert.equal(violations.length, 1)
    } finally {
      await rm(dir, { recursive: true })
    }
  })

  it('does not fire on cast to string', async () => {
    const dir = await mkdtemp(join(tmpdir(), 'no-unsafe-type-cast-'))
    try {
      const file = join(dir, 'test.ts')
      await writeFile(file, 'const x = foo as string\n')
      const violations = await rule.check([file], {})
      assert.equal(violations.length, 0)
    } finally {
      await rm(dir, { recursive: true })
    }
  })

  it('does not fire on type annotation without as', async () => {
    const dir = await mkdtemp(join(tmpdir(), 'no-unsafe-type-cast-'))
    try {
      const file = join(dir, 'test.ts')
      await writeFile(file, 'const x: unknown = foo\n')
      const violations = await rule.check([file], {})
      assert.equal(violations.length, 0)
    } finally {
      await rm(dir, { recursive: true })
    }
  })
})
