import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { writeFile, mkdtemp, rm } from 'node:fs/promises'
import { join } from 'node:path'
import { tmpdir } from 'node:os'
import { rule } from './partial-impl-flag.js'

// violations-suppress-start: shared/partial-impl-flag intentional - test file for this rule
describe('shared/partial-impl-flag', () => {
  it('fires when PARTIAL IMPLEMENTATION appears after line 5', async () => {
    const dir = await mkdtemp(join(tmpdir(), 'partial-impl-'))
    try {
      const file = join(dir, 'test.ts')
      const content = [
        'line 1',
        'line 2',
        'line 3',
        'line 4',
        'line 5',
        '// PARTIAL IMPLEMENTATION - foo not done',
        'export function foo() {}',
      ].join('\n')
      await writeFile(file, content)
      const violations = await rule.check([file], {})
      assert.equal(violations.length, 1)
      assert.equal(violations[0].line, 6)
      assert.match(violations[0].message, /PARTIAL IMPLEMENTATION/)
    } finally {
      await rm(dir, { recursive: true })
    }
  })

  it('only reports the first occurrence per file', async () => {
    const dir = await mkdtemp(join(tmpdir(), 'partial-impl-'))
    try {
      const file = join(dir, 'test.ts')
      const content = [
        'line 1', 'line 2', 'line 3', 'line 4', 'line 5',
        '// PARTIAL IMPLEMENTATION first',
        'code',
        '// PARTIAL IMPLEMENTATION second',
      ].join('\n')
      await writeFile(file, content)
      const violations = await rule.check([file], {})
      assert.equal(violations.length, 1)
      assert.equal(violations[0].line, 6)
    } finally {
      await rm(dir, { recursive: true })
    }
  })

  it('does not fire when marker is in lines 1-5 (grace zone)', async () => {
    const dir = await mkdtemp(join(tmpdir(), 'partial-impl-'))
    try {
      const file = join(dir, 'test.ts')
      // Marker at line 2 (index 1) - inside grace zone
      const content = 'line 1\n// PARTIAL IMPLEMENTATION header marker\nline 3\n'
      await writeFile(file, content)
      const violations = await rule.check([file], {})
      assert.equal(violations.length, 0)
    } finally {
      await rm(dir, { recursive: true })
    }
  })

  it('does not fire on files without the marker', async () => {
    const dir = await mkdtemp(join(tmpdir(), 'partial-impl-'))
    try {
      const file = join(dir, 'test.ts')
      await writeFile(file, 'export function complete() { return 42 }\n')
      const violations = await rule.check([file], {})
      assert.equal(violations.length, 0)
    } finally {
      await rm(dir, { recursive: true })
    }
  })
})
