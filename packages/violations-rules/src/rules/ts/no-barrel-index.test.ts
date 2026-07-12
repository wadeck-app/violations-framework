import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { writeFile, mkdtemp, rm } from 'node:fs/promises'
import { join } from 'node:path'
import { tmpdir } from 'node:os'
import { rule } from './no-barrel-index.js'

describe('ts/no-barrel-index', () => {
  it('fires on a file named index.ts', async () => {
    const dir = await mkdtemp(join(tmpdir(), 'no-barrel-index-'))
    try {
      const file = join(dir, 'index.ts')
      await writeFile(file, "export { Foo } from './Foo'\n")
      const violations = await rule.check([file], {})
      assert.equal(violations.length, 1)
      assert.equal(violations[0].line, 1)
      assert.match(violations[0].message, /Barrel index file/)
    } finally {
      await rm(dir, { recursive: true })
    }
  })

  it('fires on a file named index.tsx', async () => {
    const dir = await mkdtemp(join(tmpdir(), 'no-barrel-index-'))
    try {
      const file = join(dir, 'index.tsx')
      await writeFile(file, "export { Foo } from './Foo'\n")
      const violations = await rule.check([file], {})
      assert.equal(violations.length, 1)
    } finally {
      await rm(dir, { recursive: true })
    }
  })

  it('does not fire on myComponent.ts', async () => {
    const dir = await mkdtemp(join(tmpdir(), 'no-barrel-index-'))
    try {
      const file = join(dir, 'myComponent.ts')
      await writeFile(file, 'export const x = 1\n')
      const violations = await rule.check([file], {})
      assert.equal(violations.length, 0)
    } finally {
      await rm(dir, { recursive: true })
    }
  })

  it('does not fire on indexHelper.ts', async () => {
    const dir = await mkdtemp(join(tmpdir(), 'no-barrel-index-'))
    try {
      const file = join(dir, 'indexHelper.ts')
      await writeFile(file, 'export const x = 1\n')
      const violations = await rule.check([file], {})
      assert.equal(violations.length, 0)
    } finally {
      await rm(dir, { recursive: true })
    }
  })
})
