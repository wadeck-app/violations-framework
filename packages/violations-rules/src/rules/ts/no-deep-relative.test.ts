import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { writeFile, mkdtemp, rm } from 'node:fs/promises'
import { join } from 'node:path'
import { tmpdir } from 'node:os'
import { rule } from './no-deep-relative.js'

describe('ts/no-deep-relative', () => {
  it('flags two-level relative imports', async () => {
    const dir = await mkdtemp(join(tmpdir(), 'no-deep-relative-'))
    try {
      const file = join(dir, 'test.ts')
      await writeFile(file, `import { foo } from '../../utils/foo'\n`)
      const violations = await rule.check([file], {})
      assert.equal(violations.length, 1)
      assert.equal(violations[0].line, 1)
      assert.match(violations[0].message, /Deep relative/)
    } finally {
      await rm(dir, { recursive: true })
    }
  })

  it('flags three-level relative imports', async () => {
    const dir = await mkdtemp(join(tmpdir(), 'no-deep-relative-'))
    try {
      const file = join(dir, 'test.ts')
      await writeFile(file, `import { foo } from '../../../utils/foo'\n`)
      const violations = await rule.check([file], {})
      assert.equal(violations.length, 1)
    } finally {
      await rm(dir, { recursive: true })
    }
  })

  it('flags export statement with deep relative', async () => {
    const dir = await mkdtemp(join(tmpdir(), 'no-deep-relative-'))
    try {
      const file = join(dir, 'test.ts')
      await writeFile(file, `export { bar } from '../../lib/bar'\n`)
      const violations = await rule.check([file], {})
      assert.equal(violations.length, 1)
    } finally {
      await rm(dir, { recursive: true })
    }
  })

  it('allows single-level relative imports', async () => {
    const dir = await mkdtemp(join(tmpdir(), 'no-deep-relative-'))
    try {
      const file = join(dir, 'test.ts')
      await writeFile(file, `import { foo } from '../foo'\n`)
      const violations = await rule.check([file], {})
      assert.equal(violations.length, 0)
    } finally {
      await rm(dir, { recursive: true })
    }
  })

  it('allows path alias imports', async () => {
    const dir = await mkdtemp(join(tmpdir(), 'no-deep-relative-'))
    try {
      const file = join(dir, 'test.ts')
      await writeFile(file, `import { foo } from '@/utils/foo'\n`)
      const violations = await rule.check([file], {})
      assert.equal(violations.length, 0)
    } finally {
      await rm(dir, { recursive: true })
    }
  })

  it('returns empty array for empty files list', async () => {
    const violations = await rule.check([], {})
    assert.equal(violations.length, 0)
  })
})
