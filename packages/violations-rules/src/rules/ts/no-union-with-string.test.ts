import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { writeFile, mkdtemp, rm } from 'node:fs/promises'
import { join } from 'node:path'
import { tmpdir } from 'node:os'
import { rule } from './no-union-with-string.js'

describe('ts/no-union-with-string', () => {
  it("fires on 'a' | 'b' | string", async () => {
    const dir = await mkdtemp(join(tmpdir(), 'no-union-string-'))
    try {
      const file = join(dir, 'test.ts')
      await writeFile(file, "type Foo = 'a' | 'b' | string\n")
      const violations = await rule.check([file], {})
      assert.equal(violations.length, 1)
      assert.match(violations[0].message, /closed set of literals/)
    } finally {
      await rm(dir, { recursive: true })
    }
  })

  it('fires on SomeType | string', async () => {
    const dir = await mkdtemp(join(tmpdir(), 'no-union-string-'))
    try {
      const file = join(dir, 'test.ts')
      await writeFile(file, 'type Bar = SomeType | string\n')
      const violations = await rule.check([file], {})
      assert.equal(violations.length, 1)
    } finally {
      await rm(dir, { recursive: true })
    }
  })

  it('does not fire on string[]', async () => {
    const dir = await mkdtemp(join(tmpdir(), 'no-union-string-'))
    try {
      const file = join(dir, 'test.ts')
      await writeFile(file, 'type Arr = string[]\n')
      const violations = await rule.check([file], {})
      assert.equal(violations.length, 0)
    } finally {
      await rm(dir, { recursive: true })
    }
  })

  it("does not fire on 'a' | 'b' without | string", async () => {
    const dir = await mkdtemp(join(tmpdir(), 'no-union-string-'))
    try {
      const file = join(dir, 'test.ts')
      await writeFile(file, "type Baz = 'a' | 'b'\n")
      const violations = await rule.check([file], {})
      assert.equal(violations.length, 0)
    } finally {
      await rm(dir, { recursive: true })
    }
  })
})
