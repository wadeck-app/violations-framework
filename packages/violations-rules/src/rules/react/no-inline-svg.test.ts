import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { writeFile, mkdtemp, rm, mkdir } from 'node:fs/promises'
import { join } from 'node:path'
import { tmpdir } from 'node:os'
import { rule } from './no-inline-svg.js'

describe('react/no-inline-svg', () => {
  it('fires on <svg in a non-atomic file', async () => {
    const dir = await mkdtemp(join(tmpdir(), 'no-inline-svg-'))
    try {
      const file = join(dir, 'Icon.tsx')
      await writeFile(file, 'export function Icon() {\n  return <svg viewBox="0 0 16 16" />\n}\n')
      const violations = await rule.check([file], {})
      assert.equal(violations.length, 1)
      assert.equal(violations[0].line, 2)
      assert.match(violations[0].message, /Inline <svg>/)
    } finally {
      await rm(dir, { recursive: true })
    }
  })

  it('does not fire in an atomic file', async () => {
    const dir = await mkdtemp(join(tmpdir(), 'no-inline-svg-'))
    try {
      const file = join(dir, 'SvgIcon.tsx')
      await writeFile(
        file,
        '/** @registryCategory atomic */\nexport function SvgIcon() {\n  return <svg />\n}\n',
      )
      const violations = await rule.check([file], {})
      assert.equal(violations.length, 0)
    } finally {
      await rm(dir, { recursive: true })
    }
  })

  it('does not fire in a display/Chart.tsx file', async () => {
    const dir = await mkdtemp(join(tmpdir(), 'no-inline-svg-'))
    try {
      const displayDir = join(dir, 'display')
      await mkdir(displayDir)
      const file = join(displayDir, 'Chart.tsx')
      await writeFile(file, 'export function Chart() {\n  return <svg />\n}\n')
      const violations = await rule.check([file], {})
      assert.equal(violations.length, 0)
    } finally {
      await rm(dir, { recursive: true })
    }
  })

  it('does not fire when no <svg in file', async () => {
    const dir = await mkdtemp(join(tmpdir(), 'no-inline-svg-'))
    try {
      const file = join(dir, 'Card.tsx')
      await writeFile(file, 'export function Card() {\n  return <div />\n}\n')
      const violations = await rule.check([file], {})
      assert.equal(violations.length, 0)
    } finally {
      await rm(dir, { recursive: true })
    }
  })
})
