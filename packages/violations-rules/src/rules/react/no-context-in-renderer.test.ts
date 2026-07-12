import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { writeFile, mkdtemp, rm } from 'node:fs/promises'
import { join } from 'node:path'
import { tmpdir } from 'node:os'
import { rule } from './no-context-in-renderer.js'

describe('react/no-context-in-renderer', () => {
  it('fires when createContext() appears in a file (no restriction)', async () => {
    const dir = await mkdtemp(join(tmpdir(), 'no-context-'))
    try {
      const file = join(dir, 'renderer.ts')
      await writeFile(file, 'import { createContext } from "react"\nconst ctx = createContext(null)\n')
      const violations = await rule.check([file], {})
      assert.equal(violations.length, 1)
      assert.equal(violations[0].line, 2)
      assert.match(violations[0].message, /createContext/)
    } finally {
      await rm(dir, { recursive: true })
    }
  })

  it('does not fire when createContext() is in a // comment line', async () => {
    const dir = await mkdtemp(join(tmpdir(), 'no-context-'))
    try {
      const file = join(dir, 'renderer.ts')
      await writeFile(file, '// createContext() is forbidden here\nexport const x = 1\n')
      const violations = await rule.check([file], {})
      assert.equal(violations.length, 0)
    } finally {
      await rm(dir, { recursive: true })
    }
  })

  it('does not fire on an inline comment after code on the same line', async () => {
    const dir = await mkdtemp(join(tmpdir(), 'no-context-'))
    try {
      const file = join(dir, 'renderer.ts')
      await writeFile(file, 'export const x = 1 // createContext() is forbidden\n')
      const violations = await rule.check([file], {})
      assert.equal(violations.length, 0)
    } finally {
      await rm(dir, { recursive: true })
    }
  })

  // violations-suppress: shared/no-em-dash intentional test fixture
  it('respects restrictToPackages — skips files not under the restricted path', async () => {
    const dir = await mkdtemp(join(tmpdir(), 'no-context-'))
    try {
      const file = join(dir, 'other.ts')
      await writeFile(file, 'const ctx = createContext(null)\n')
      const violations = await rule.check([file], { restrictToPackages: ['packages/dsl-renderer'] })
      assert.equal(violations.length, 0)
    } finally {
      await rm(dir, { recursive: true })
    }
  })

  // violations-suppress: shared/no-em-dash intentional test fixture
  it('respects restrictToPackages — fires for files under the restricted path', async () => {
    const dir = await mkdtemp(join(tmpdir(), 'no-context-'))
    try {
      // Simulate a path that contains 'packages/dsl-renderer'
      const subdir = join(dir, 'packages', 'dsl-renderer')
      const { mkdir } = await import('node:fs/promises')
      await mkdir(subdir, { recursive: true })
      const file = join(subdir, 'renderer.ts')
      await writeFile(file, 'const ctx = createContext(null)\n')
      const violations = await rule.check([file], { restrictToPackages: ['packages/dsl-renderer'] })
      assert.equal(violations.length, 1)
    } finally {
      await rm(dir, { recursive: true })
    }
  })

  it('returns empty array for empty file list', async () => {
    const violations = await rule.check([], {})
    assert.equal(violations.length, 0)
  })
})
