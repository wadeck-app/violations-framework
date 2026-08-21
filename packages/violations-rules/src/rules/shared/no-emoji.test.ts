import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { writeFile, mkdtemp, rm } from 'node:fs/promises'
import { join } from 'node:path'
import { tmpdir } from 'node:os'
import { rule } from './no-emoji.js'

describe('shared/no-emoji', () => {
  it('flags emoji in a .ts file', async () => {
    const dir = await mkdtemp(join(tmpdir(), 'no-emoji-'))
    try {
      const file = join(dir, 'test.ts')
      await writeFile(file, 'const x = "hello \u{1F389}"\n')
      const violations = await rule.check([file], {})
      assert.ok(violations.length > 0)
      assert.equal(violations[0].line, 1)
      assert.match(violations[0].message, /Emoji/)
    } finally {
      await rm(dir, { recursive: true })
    }
  })

  it('flags arrow glyph (U+25BE, in 2500-27BF block)', async () => {
    const dir = await mkdtemp(join(tmpdir(), 'no-emoji-'))
    try {
      const file = join(dir, 'test.tsx')
      await writeFile(file, 'const btn = <Button>\u{25BE} Open</Button>\n')
      const violations = await rule.check([file], {})
      assert.ok(violations.length > 0)
    } finally {
      await rm(dir, { recursive: true })
    }
  })

  it('does not flag plain ASCII', async () => {
    const dir = await mkdtemp(join(tmpdir(), 'no-emoji-'))
    try {
      const file = join(dir, 'test.ts')
      await writeFile(file, 'const x = "hello world"\n')
      const violations = await rule.check([file], {})
      assert.equal(violations.length, 0)
    } finally {
      await rm(dir, { recursive: true })
    }
  })

  it('does not flag French accented letters', async () => {
    const dir = await mkdtemp(join(tmpdir(), 'no-emoji-'))
    try {
      const file = join(dir, 'test.ts')
      await writeFile(file, 'const msg = "é è à ç ù â î ô û ë ï ü"\n')
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
