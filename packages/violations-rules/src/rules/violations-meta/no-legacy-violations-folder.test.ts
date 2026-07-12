import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { mkdtemp, mkdir, rm } from 'node:fs/promises'
import { join } from 'node:path'
import { tmpdir } from 'node:os'
import { rule } from './no-legacy-violations-folder.js'

describe('violations-meta/no-legacy-violations-folder', () => {
  it('fires when scripts/violations/ directory exists', async () => {
    const dir = await mkdtemp(join(tmpdir(), 'no-legacy-violations-'))
    try {
      await mkdir(join(dir, 'scripts', 'violations'), { recursive: true })
      const violations = await rule.check([], { projectRoot: dir })
      assert.equal(violations.length, 1)
      assert.match(violations[0].message, /Migrate rule files/)
    } finally {
      await rm(dir, { recursive: true })
    }
  })

  it('does not fire when scripts/violations/ directory does not exist', async () => {
    const dir = await mkdtemp(join(tmpdir(), 'no-legacy-violations-'))
    try {
      const violations = await rule.check([], { projectRoot: dir })
      assert.equal(violations.length, 0)
    } finally {
      await rm(dir, { recursive: true })
    }
  })

  it('does not fire when only scripts/ exists but not scripts/violations/', async () => {
    const dir = await mkdtemp(join(tmpdir(), 'no-legacy-violations-'))
    try {
      await mkdir(join(dir, 'scripts'), { recursive: true })
      const violations = await rule.check([], { projectRoot: dir })
      assert.equal(violations.length, 0)
    } finally {
      await rm(dir, { recursive: true })
    }
  })
})
