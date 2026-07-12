import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { writeFile, mkdtemp, rm, mkdir } from 'node:fs/promises'
import { join } from 'node:path'
import { tmpdir } from 'node:os'
import { rule } from './no-namespace.js'

describe('cs/no-namespace', () => {
  it('fires on same-line namespace Foo {', async () => {
    const dir = await mkdtemp(join(tmpdir(), 'test-'))
    try {
      const file = join(dir, 'Foo.cs')
      await writeFile(file, 'namespace Foo {\n  public class Bar {}\n}\n')
      const violations = await rule.check([file], {})
      assert.equal(violations.length, 1)
      assert.equal(violations[0].line, 1)
    } finally {
      await rm(dir, { recursive: true })
    }
  })

  it('fires on Allman style namespace', async () => {
    const dir = await mkdtemp(join(tmpdir(), 'test-'))
    try {
      const file = join(dir, 'Foo.cs')
      await writeFile(file, 'namespace Foo\n{\n  public class Bar {}\n}\n')
      const violations = await rule.check([file], {})
      assert.equal(violations.length, 1)
      assert.equal(violations[0].line, 1)
    } finally {
      await rm(dir, { recursive: true })
    }
  })

  it('fires on file-scoped namespace Foo;', async () => {
    const dir = await mkdtemp(join(tmpdir(), 'test-'))
    try {
      const file = join(dir, 'Foo.cs')
      await writeFile(file, 'namespace Foo;\npublic class Bar {}\n')
      const violations = await rule.check([file], {})
      assert.equal(violations.length, 1)
      assert.equal(violations[0].line, 1)
    } finally {
      await rm(dir, { recursive: true })
    }
  })

  it('does not fire when no namespace', async () => {
    const dir = await mkdtemp(join(tmpdir(), 'test-'))
    try {
      const file = join(dir, 'Foo.cs')
      await writeFile(file, 'public class Bar {}\n')
      const violations = await rule.check([file], {})
      assert.equal(violations.length, 0)
    } finally {
      await rm(dir, { recursive: true })
    }
  })

  it('does not fire for files in _generated/ path', async () => {
    const dir = await mkdtemp(join(tmpdir(), 'test-'))
    try {
      const subdir = join(dir, '_generated')
      await mkdir(subdir)
      const file = join(subdir, 'Foo.cs')
      await writeFile(file, 'namespace Foo {\n  public class Bar {}\n}\n')
      // The path will contain /_generated/ on posix or \_generated\ on windows
      const violations = await rule.check([file], {})
      assert.equal(violations.length, 0)
    } finally {
      await rm(dir, { recursive: true })
    }
  })
})
