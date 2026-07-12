import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { writeFile, mkdtemp, rm } from 'node:fs/promises'
import { join } from 'node:path'
import { tmpdir } from 'node:os'
import { rule } from './no-french.js'

describe('shared/no-french', () => {
  it('fires on accented characters', async () => {
    const dir = await mkdtemp(join(tmpdir(), 'no-french-'))
    try {
      const file = join(dir, 'test.ts')
      // violations-suppress: shared/no-french intentional test
      await writeFile(file, 'const msg = "résumé"\n')
      const violations = await rule.check([file], {})
      assert.equal(violations.length, 1)
      assert.match(violations[0].message, /accented character/)
    } finally {
      await rm(dir, { recursive: true })
    }
  })

  it('fires on built-in French words', async () => {
    const dir = await mkdtemp(join(tmpdir(), 'no-french-'))
    try {
      const file = join(dir, 'test.ts')
      await writeFile(file, 'const x = "dans le code"\n')
      const violations = await rule.check([file], {})
      assert.ok(violations.length >= 1)
      assert.match(violations[0].message, /French word/)
    } finally {
      await rm(dir, { recursive: true })
    }
  })

  it('fires on extra words from config', async () => {
    const dir = await mkdtemp(join(tmpdir(), 'no-french-'))
    try {
      const file = join(dir, 'test.ts')
      // Word must be surrounded by whitespace for the word-boundary regex to match
      await writeFile(file, 'bonjour monde\n')
      const violations = await rule.check([file], { extraWords: ['bonjour'] })
      assert.equal(violations.length, 1)
    } finally {
      await rm(dir, { recursive: true })
    }
  })

  it('does not fire on plain English code', async () => {
    const dir = await mkdtemp(join(tmpdir(), 'no-french-'))
    try {
      const file = join(dir, 'test.ts')
      await writeFile(file, 'const msg = "hello world"\nexport function getValue(): string { return "test" }\n')
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
