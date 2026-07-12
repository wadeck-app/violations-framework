import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { writeFile, mkdtemp, rm } from 'node:fs/promises'
import { join } from 'node:path'
import { tmpdir } from 'node:os'
import { rule } from './no-raw-button.js'

describe('react/no-raw-button', () => {
  it('fires when a non-atomic file contains <button', async () => {
    const dir = await mkdtemp(join(tmpdir(), 'no-raw-button-'))
    try {
      const file = join(dir, 'Foo.tsx')
      await writeFile(file, 'export function Foo() {\n  return <button>click</button>\n}\n')
      const violations = await rule.check([file], {})
      assert.equal(violations.length, 1)
      assert.equal(violations[0].line, 2)
      assert.match(violations[0].message, /Raw <button>/)
    } finally {
      await rm(dir, { recursive: true })
    }
  })

  it('does not fire when the file is tagged @registryCategory atomic', async () => {
    const dir = await mkdtemp(join(tmpdir(), 'no-raw-button-'))
    try {
      const file = join(dir, 'Button.tsx')
      await writeFile(
        file,
        '/**\n * @registryCategory atomic\n */\nexport function Button() {\n  return <button>click</button>\n}\n',
      )
      const violations = await rule.check([file], {})
      assert.equal(violations.length, 0)
    } finally {
      await rm(dir, { recursive: true })
    }
  })

  it('does not fire when there is no <button in the file', async () => {
    const dir = await mkdtemp(join(tmpdir(), 'no-raw-button-'))
    try {
      const file = join(dir, 'Card.tsx')
      await writeFile(file, 'export function Card() {\n  return <div>content</div>\n}\n')
      const violations = await rule.check([file], {})
      assert.equal(violations.length, 0)
    } finally {
      await rm(dir, { recursive: true })
    }
  })

  it('returns empty array for empty file list', async () => {
    const violations = await rule.check([], {})
    assert.equal(violations.length, 0)
  })
})
