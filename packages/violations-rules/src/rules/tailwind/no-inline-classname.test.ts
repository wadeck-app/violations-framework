import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { writeFile, mkdtemp, rm } from 'node:fs/promises'
import { join } from 'node:path'
import { tmpdir } from 'node:os'
import { rule } from './no-inline-classname.js'

const LONG_CLASS = 'flex items-center justify-between gap-4 px-4 py-2 rounded-lg border border-border bg-surface text-sm'

describe('tailwind/no-inline-classname', () => {
  it('fires when className string exceeds default 80 chars', async () => {
    const dir = await mkdtemp(join(tmpdir(), 'no-inline-cn-'))
    try {
      const file = join(dir, 'Card.tsx')
      await writeFile(file, `<div className="${LONG_CLASS}" />\n`)
      const violations = await rule.check([file], {})
      assert.equal(violations.length, 1)
      assert.equal(violations[0].line, 1)
      assert.match(violations[0].message, /extract to a named module-level constant/)
    } finally {
      await rm(dir, { recursive: true })
    }
  })

  it('does not fire when className string is within default 80 chars', async () => {
    const dir = await mkdtemp(join(tmpdir(), 'no-inline-cn-'))
    try {
      const file = join(dir, 'Card.tsx')
      await writeFile(file, '<div className="flex items-center gap-2" />\n')
      const violations = await rule.check([file], {})
      assert.equal(violations.length, 0)
    } finally {
      await rm(dir, { recursive: true })
    }
  })

  it('respects custom maxChars config', async () => {
    const dir = await mkdtemp(join(tmpdir(), 'no-inline-cn-'))
    try {
      const file = join(dir, 'Card.tsx')
      // 30+ char class that is under 80 but over 20
      await writeFile(file, '<div className="flex items-center justify-between" />\n')
      const violations = await rule.check([file], { maxChars: 20 })
      assert.equal(violations.length, 1)
    } finally {
      await rm(dir, { recursive: true })
    }
  })

  it('does not fire on const declarations (the extraction target)', async () => {
    const dir = await mkdtemp(join(tmpdir(), 'no-inline-cn-'))
    try {
      const file = join(dir, 'Card.tsx')
      await writeFile(file, `const cardClass = "${LONG_CLASS}"\n`)
      const violations = await rule.check([file], {})
      assert.equal(violations.length, 0)
    } finally {
      await rm(dir, { recursive: true })
    }
  })

  it('does not fire on dynamic className (template literal)', async () => {
    const dir = await mkdtemp(join(tmpdir(), 'no-inline-cn-'))
    try {
      const file = join(dir, 'Card.tsx')
      await writeFile(file, 'const x = `className="${LONG_CLASS} ${extra}"`\n')
      const violations = await rule.check([file], {})
      assert.equal(violations.length, 0)
    } finally {
      await rm(dir, { recursive: true })
    }
  })
})
