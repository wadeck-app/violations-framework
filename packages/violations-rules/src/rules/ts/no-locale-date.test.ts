import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { writeFile, mkdtemp, rm } from 'node:fs/promises'
import { join } from 'node:path'
import { tmpdir } from 'node:os'
import { rule } from './no-locale-date.js'

describe('ts/no-locale-date', () => {
  it('fires on .toLocaleString()', async () => {
    const dir = await mkdtemp(join(tmpdir(), 'no-locale-date-'))
    try {
      const file = join(dir, 'test.ts')
      await writeFile(file, 'const s = date.toLocaleString()\n')
      const violations = await rule.check([file], {})
      assert.equal(violations.length, 1)
      assert.match(violations[0].message, /formatRelativeTime/)
    } finally {
      await rm(dir, { recursive: true })
    }
  })

  it('fires on .toLocaleDateString()', async () => {
    const dir = await mkdtemp(join(tmpdir(), 'no-locale-date-'))
    try {
      const file = join(dir, 'test.ts')
      await writeFile(file, 'const s = date.toLocaleDateString()\n')
      const violations = await rule.check([file], {})
      assert.equal(violations.length, 1)
    } finally {
      await rm(dir, { recursive: true })
    }
  })

  it('fires on .toLocaleTimeString()', async () => {
    const dir = await mkdtemp(join(tmpdir(), 'no-locale-date-'))
    try {
      const file = join(dir, 'test.ts')
      await writeFile(file, 'const s = date.toLocaleTimeString()\n')
      const violations = await rule.check([file], {})
      assert.equal(violations.length, 1)
    } finally {
      await rm(dir, { recursive: true })
    }
  })

  it('does not fire on unrelated code', async () => {
    const dir = await mkdtemp(join(tmpdir(), 'no-locale-date-'))
    try {
      const file = join(dir, 'test.ts')
      await writeFile(file, 'const s = date.toISOString()\n')
      const violations = await rule.check([file], {})
      assert.equal(violations.length, 0)
    } finally {
      await rm(dir, { recursive: true })
    }
  })
})
