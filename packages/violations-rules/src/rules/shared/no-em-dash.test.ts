import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { writeFile, mkdtemp, rm } from 'node:fs/promises'
import { join } from 'node:path'
import { tmpdir } from 'node:os'
import { rule } from './no-em-dash.js'

describe('shared/no-em-dash', () => {
  it('fires on a file containing an em-dash (U+2014)', async () => {
    const dir = await mkdtemp(join(tmpdir(), 'no-em-dash-'))
    try {
      const file = join(dir, 'test.ts')
      // violations-suppress: shared/no-em-dash intentional test fixture
      await writeFile(file, 'const msg = "hello—world"\n')
      const violations = await rule.check([file], {})
      assert.equal(violations.length, 1)
      assert.equal(violations[0].line, 1)
      assert.match(violations[0].message, /Typographic decorator/)
    } finally {
      await rm(dir, { recursive: true })
    }
  })

  it('fires on a file containing an en-dash (U+2013)', async () => {
    const dir = await mkdtemp(join(tmpdir(), 'no-em-dash-'))
    try {
      const file = join(dir, 'test.ts')
      // violations-suppress: shared/no-em-dash intentional test fixture
      await writeFile(file, 'const x = 1–3\n')
      const violations = await rule.check([file], {})
      assert.equal(violations.length, 1)
    } finally {
      await rm(dir, { recursive: true })
    }
  })

  it('fires on the correct line number', async () => {
    const dir = await mkdtemp(join(tmpdir(), 'no-em-dash-'))
    try {
      const file = join(dir, 'test.ts')
      // violations-suppress: shared/no-em-dash intentional test fixture
      await writeFile(file, 'const a = 1\nconst b = "hello—world"\nconst c = 3\n')
      const violations = await rule.check([file], {})
      assert.equal(violations.length, 1)
      assert.equal(violations[0].line, 2)
    } finally {
      await rm(dir, { recursive: true })
    }
  })

  it('fires on a file containing a middle-dot (U+00B7)', async () => {
    const dir = await mkdtemp(join(tmpdir(), 'no-em-dash-'))
    try {
      const file = join(dir, 'test.tsx')
      // violations-suppress: shared/no-em-dash intentional test fixture
      await writeFile(file, 'const label = "v1.0\u{00B7}click to check"\n')
      const violations = await rule.check([file], {})
      assert.equal(violations.length, 1)
      assert.equal(violations[0].line, 1)
      assert.match(violations[0].message, /middle-dot/)
    } finally {
      await rm(dir, { recursive: true })
    }
  })

  it('fires on a file containing a hyphenation-point (U+2027)', async () => {
    const dir = await mkdtemp(join(tmpdir(), 'no-em-dash-'))
    try {
      const file = join(dir, 'test.ts')
      // violations-suppress: shared/no-em-dash intentional test fixture
      await writeFile(file, 'const x = "a\u{2027}b"\n')
      const violations = await rule.check([file], {})
      assert.equal(violations.length, 1)
    } finally {
      await rm(dir, { recursive: true })
    }
  })

  it('fires on a file containing a bullet (U+2022)', async () => {
    const dir = await mkdtemp(join(tmpdir(), 'no-em-dash-'))
    try {
      const file = join(dir, 'test.tsx')
      // violations-suppress: shared/no-em-dash intentional test fixture
      await writeFile(file, 'const sep = "\u{2022} item"\n')
      const violations = await rule.check([file], {})
      assert.equal(violations.length, 1)
    } finally {
      await rm(dir, { recursive: true })
    }
  })

  it('fires on a file containing a triangular bullet (U+2023)', async () => {
    const dir = await mkdtemp(join(tmpdir(), 'no-em-dash-'))
    try {
      const file = join(dir, 'test.tsx')
      // violations-suppress: shared/no-em-dash intentional test fixture
      await writeFile(file, 'const sep = "\u{2023} item"\n')
      const violations = await rule.check([file], {})
      assert.equal(violations.length, 1)
    } finally {
      await rm(dir, { recursive: true })
    }
  })

  it('fires on a file containing a single angle quote (U+203A)', async () => {
    const dir = await mkdtemp(join(tmpdir(), 'no-em-dash-'))
    try {
      const file = join(dir, 'test.tsx')
      // violations-suppress: shared/no-em-dash intentional test fixture
      await writeFile(file, 'const sep = "item\u{203A}"\n')
      const violations = await rule.check([file], {})
      assert.equal(violations.length, 1)
    } finally {
      await rm(dir, { recursive: true })
    }
  })

  it('fires on a file containing a double angle quote (U+00BB)', async () => {
    const dir = await mkdtemp(join(tmpdir(), 'no-em-dash-'))
    try {
      const file = join(dir, 'test.tsx')
      // violations-suppress: shared/no-em-dash intentional test fixture
      await writeFile(file, 'const sep = "item\u{00BB}"\n')
      const violations = await rule.check([file], {})
      assert.equal(violations.length, 1)
    } finally {
      await rm(dir, { recursive: true })
    }
  })

  it('fires on a file containing an ellipsis (U+2026)', async () => {
    const dir = await mkdtemp(join(tmpdir(), 'no-em-dash-'))
    try {
      const file = join(dir, 'test.tsx')
      // violations-suppress: shared/no-em-dash intentional test fixture
      await writeFile(file, 'const label = "loading\u{2026}"\n')
      const violations = await rule.check([file], {})
      assert.equal(violations.length, 1)
    } finally {
      await rm(dir, { recursive: true })
    }
  })

  it('does not fire on a file with only plain hyphens', async () => {
    const dir = await mkdtemp(join(tmpdir(), 'no-em-dash-'))
    try {
      const file = join(dir, 'test.ts')
      await writeFile(file, 'const x = "hello-world"\n')
      const violations = await rule.check([file], {})
      assert.equal(violations.length, 0)
    } finally {
      await rm(dir, { recursive: true })
    }
  })

  it('returns empty array for empty files list', async () => {
    const violations = await rule.check([], {})
    assert.equal(violations.length, 0)
  })
})
