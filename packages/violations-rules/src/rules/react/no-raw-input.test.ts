import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { writeFile, mkdtemp, rm } from 'node:fs/promises'
import { join } from 'node:path'
import { tmpdir } from 'node:os'
import { rule } from './no-raw-input.js'

describe('react/no-raw-input', () => {
  it('fires on <input type="text"> in a non-atomic file', async () => {
    const dir = await mkdtemp(join(tmpdir(), 'no-raw-input-'))
    try {
      const file = join(dir, 'Form.tsx')
      await writeFile(file, 'export function Form() {\n  return <input type="text" />\n}\n')
      const violations = await rule.check([file], {})
      assert.equal(violations.length, 1)
      assert.equal(violations[0].line, 2)
    } finally {
      await rm(dir, { recursive: true })
    }
  })

  it('fires on <input type="email"> (banned type)', async () => {
    const dir = await mkdtemp(join(tmpdir(), 'no-raw-input-'))
    try {
      const file = join(dir, 'Form.tsx')
      await writeFile(file, '<input type="email" />\n')
      const violations = await rule.check([file], {})
      assert.equal(violations.length, 1)
    } finally {
      await rm(dir, { recursive: true })
    }
  })

  it('fires on <input> with no type (defaults to text)', async () => {
    const dir = await mkdtemp(join(tmpdir(), 'no-raw-input-'))
    try {
      const file = join(dir, 'Form.tsx')
      await writeFile(file, '<input className="foo" />\n')
      const violations = await rule.check([file], {})
      assert.equal(violations.length, 1)
    } finally {
      await rm(dir, { recursive: true })
    }
  })

  it('does not fire on <input type="checkbox"> (allowed type)', async () => {
    const dir = await mkdtemp(join(tmpdir(), 'no-raw-input-'))
    try {
      const file = join(dir, 'Form.tsx')
      await writeFile(file, '<input type="checkbox" />\n')
      const violations = await rule.check([file], {})
      assert.equal(violations.length, 0)
    } finally {
      await rm(dir, { recursive: true })
    }
  })

  it('does not fire on <input type="file"> (allowed type)', async () => {
    const dir = await mkdtemp(join(tmpdir(), 'no-raw-input-'))
    try {
      const file = join(dir, 'Form.tsx')
      await writeFile(file, '<input type="file" />\n')
      const violations = await rule.check([file], {})
      assert.equal(violations.length, 0)
    } finally {
      await rm(dir, { recursive: true })
    }
  })

  it('does not fire in an atomic file', async () => {
    const dir = await mkdtemp(join(tmpdir(), 'no-raw-input-'))
    try {
      const file = join(dir, 'FieldText.tsx')
      await writeFile(
        file,
        '/** @registryCategory atomic */\nexport function FieldText() {\n  return <input type="text" />\n}\n',
      )
      const violations = await rule.check([file], {})
      assert.equal(violations.length, 0)
    } finally {
      await rm(dir, { recursive: true })
    }
  })

  it('detects type on the following line (multi-line JSX)', async () => {
    const dir = await mkdtemp(join(tmpdir(), 'no-raw-input-'))
    try {
      const file = join(dir, 'Form.tsx')
      await writeFile(file, 'return (\n  <input\n    type="password"\n  />\n)\n')
      const violations = await rule.check([file], {})
      assert.equal(violations.length, 1)
      assert.equal(violations[0].line, 2)
    } finally {
      await rm(dir, { recursive: true })
    }
  })
})
