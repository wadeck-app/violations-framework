import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { writeFile, mkdtemp, rm } from 'node:fs/promises'
import { join } from 'node:path'
import { tmpdir } from 'node:os'
import { rule } from './readme-system-length.js'

function makeLines(n: number): string {
  return Array.from({ length: n }, (_, i) => `line ${i + 1}`).join('\n')
}

describe('shared/readme-system-length', () => {
  it('fires when README.md exceeds the default 50-line limit', async () => {
    const dir = await mkdtemp(join(tmpdir(), 'readme-length-'))
    try {
      const file = join(dir, 'README.md')
      await writeFile(file, makeLines(51))
      const violations = await rule.check([file], {})
      assert.equal(violations.length, 1)
      assert.equal(violations[0].line, 51)
      assert.match(violations[0].message, /51 lines/)
    } finally {
      await rm(dir, { recursive: true })
    }
  })

  it('fires when README.md exceeds a custom maxLines config', async () => {
    const dir = await mkdtemp(join(tmpdir(), 'readme-length-'))
    try {
      const file = join(dir, 'README.md')
      await writeFile(file, makeLines(21))
      const violations = await rule.check([file], { maxLines: 20 })
      assert.equal(violations.length, 1)
      assert.match(violations[0].message, /21 lines/)
    } finally {
      await rm(dir, { recursive: true })
    }
  })

  it('does not fire when README.md is at or under the limit', async () => {
    const dir = await mkdtemp(join(tmpdir(), 'readme-length-'))
    try {
      const file = join(dir, 'README.md')
      await writeFile(file, makeLines(50))
      const violations = await rule.check([file], {})
      assert.equal(violations.length, 0)
    } finally {
      await rm(dir, { recursive: true })
    }
  })

  it('skips files that are not README.md', async () => {
    const dir = await mkdtemp(join(tmpdir(), 'readme-length-'))
    try {
      const file = join(dir, 'CONTRIBUTING.md')
      await writeFile(file, makeLines(100))
      const violations = await rule.check([file], {})
      assert.equal(violations.length, 0)
    } finally {
      await rm(dir, { recursive: true })
    }
  })

  it('handles case-insensitive README filename', async () => {
    const dir = await mkdtemp(join(tmpdir(), 'readme-length-'))
    try {
      const file = join(dir, 'readme.md')
      await writeFile(file, makeLines(60))
      const violations = await rule.check([file], {})
      assert.equal(violations.length, 1)
    } finally {
      await rm(dir, { recursive: true })
    }
  })
})
