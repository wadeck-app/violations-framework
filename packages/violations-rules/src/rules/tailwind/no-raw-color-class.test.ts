import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { writeFile, mkdtemp, rm } from 'node:fs/promises'
import { join } from 'node:path'
import { tmpdir } from 'node:os'
import { rule } from './no-raw-color-class.js'

describe('tailwind/no-raw-color-class', () => {
  it('fires on bg-gray-100 in a non-atomic file', async () => {
    const dir = await mkdtemp(join(tmpdir(), 'no-raw-color-'))
    try {
      const file = join(dir, 'Card.tsx')
      await writeFile(file, 'export function Card() {\n  return <div className="bg-gray-100" />\n}\n')
      const violations = await rule.check([file], {})
      assert.equal(violations.length, 1)
      assert.equal(violations[0].line, 2)
      assert.match(violations[0].message, /semantic theme token/)
    } finally {
      await rm(dir, { recursive: true })
    }
  })

  it('fires on text-green-700', async () => {
    const dir = await mkdtemp(join(tmpdir(), 'no-raw-color-'))
    try {
      const file = join(dir, 'Card.tsx')
      await writeFile(file, '<span className="text-green-700">ok</span>\n')
      const violations = await rule.check([file], {})
      assert.equal(violations.length, 1)
    } finally {
      await rm(dir, { recursive: true })
    }
  })

  it('fires on border-blue-500', async () => {
    const dir = await mkdtemp(join(tmpdir(), 'no-raw-color-'))
    try {
      const file = join(dir, 'Box.tsx')
      await writeFile(file, '<div className="border-blue-500" />\n')
      const violations = await rule.check([file], {})
      assert.equal(violations.length, 1)
    } finally {
      await rm(dir, { recursive: true })
    }
  })

  it('does not fire on semantic tokens (bg-surface, text-muted)', async () => {
    const dir = await mkdtemp(join(tmpdir(), 'no-raw-color-'))
    try {
      const file = join(dir, 'Card.tsx')
      await writeFile(file, '<div className="bg-surface text-muted border-danger" />\n')
      const violations = await rule.check([file], {})
      assert.equal(violations.length, 0)
    } finally {
      await rm(dir, { recursive: true })
    }
  })

  it('does not fire in an atomic file', async () => {
    const dir = await mkdtemp(join(tmpdir(), 'no-raw-color-'))
    try {
      const file = join(dir, 'Badge.tsx')
      await writeFile(
        file,
        '/** @registryCategory atomic */\nexport function Badge() {\n  return <span className="bg-red-500" />\n}\n',
      )
      const violations = await rule.check([file], {})
      assert.equal(violations.length, 0)
    } finally {
      await rm(dir, { recursive: true })
    }
  })

  it('does not fire on flex, w-full, p-4 (layout classes)', async () => {
    const dir = await mkdtemp(join(tmpdir(), 'no-raw-color-'))
    try {
      const file = join(dir, 'Layout.tsx')
      await writeFile(file, '<div className="flex w-full p-4 gap-2" />\n')
      const violations = await rule.check([file], {})
      assert.equal(violations.length, 0)
    } finally {
      await rm(dir, { recursive: true })
    }
  })
})
