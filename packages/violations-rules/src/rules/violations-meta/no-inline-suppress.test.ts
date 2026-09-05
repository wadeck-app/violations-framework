import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { writeFile, mkdtemp, rm } from 'node:fs/promises'
import { join } from 'node:path'
import { tmpdir } from 'node:os'
import { rule } from './no-inline-suppress.js'

describe('violations-meta/no-inline-suppress', () => {
  async function withFile(name: string, content: string): Promise<[string, () => Promise<void>]> {
    const dir = await mkdtemp(join(tmpdir(), 'no-inline-suppress-'))
    const file = join(dir, name)
    await writeFile(file, content)
    return [file, () => rm(dir, { recursive: true })]
  }

  it('flags inline suppress in .ts file', async () => {
    const [file, cleanup] = await withFile('foo.ts', `
const x = doSomething() // violations-suppress: some/rule reason
`)
    try {
      const violations = await rule.check([file], {})
      assert.equal(violations.length, 1)
      assert.equal(violations[0].line, 2)
      assert.match(violations[0].message, /move the comment to the line above/)
    } finally {
      await cleanup()
    }
  })

  it('flags inline suppress in .cs file', async () => {
    const [file, cleanup] = await withFile('foo.cs', `
Debug.Log("msg"); // violations-suppress: unity/no-debug-log Editor-only
`)
    try {
      const violations = await rule.check([file], {})
      assert.equal(violations.length, 1)
    } finally {
      await cleanup()
    }
  })

  it('does not flag standalone suppress on its own line', async () => {
    const [file, cleanup] = await withFile('foo.ts', `
// violations-suppress: some/rule reason
const x = doSomething()
`)
    try {
      const violations = await rule.check([file], {})
      assert.equal(violations.length, 0)
    } finally {
      await cleanup()
    }
  })

  it('does not flag indented standalone suppress', async () => {
    const [file, cleanup] = await withFile('foo.cs', `
    // violations-suppress: unity/no-debug-log Editor-only
    Debug.Log("msg");
`)
    try {
      const violations = await rule.check([file], {})
      assert.equal(violations.length, 0)
    } finally {
      await cleanup()
    }
  })

  it('does not flag violations-suppress-start/end on their own line', async () => {
    const [file, cleanup] = await withFile('foo.ts', `
// violations-suppress-start: some/rule
const x = 1
// violations-suppress-end: some/rule
`)
    try {
      const violations = await rule.check([file], {})
      assert.equal(violations.length, 0)
    } finally {
      await cleanup()
    }
  })

  it('returns empty array for files with no suppress', async () => {
    const [file, cleanup] = await withFile('foo.ts', 'const x = 1\n')
    try {
      const violations = await rule.check([file], {})
      assert.equal(violations.length, 0)
    } finally {
      await cleanup()
    }
  })

  it('returns empty array when files list is empty', async () => {
    const violations = await rule.check([], {})
    assert.equal(violations.length, 0)
  })
})
