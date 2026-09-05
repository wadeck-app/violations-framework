import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { writeFile, mkdtemp, rm } from 'node:fs/promises'
import { join } from 'node:path'
import { tmpdir } from 'node:os'
import { rule } from './no-emoji.js'

async function withTmp(name: string, fn: (dir: string) => Promise<void>): Promise<void> {
  const dir = await mkdtemp(join(tmpdir(), `no-emoji-${name}-`))
  try { await fn(dir) } finally { await rm(dir, { recursive: true }) }
}

describe('shared/no-emoji', () => {

  // ── Extended_Pictographic ─────────────────────────────────────────────────

  it('flags emoji (Extended_Pictographic, U+1F389)', async () => {
    await withTmp('emoji', async (dir) => {
      const file = join(dir, 'test.ts')
      await writeFile(file, 'const x = "hello \u{1F389}"\n')
      const violations = await rule.check([file], {})
      assert.ok(violations.length > 0)
      assert.equal(violations[0].line, 1)
      assert.match(violations[0].message, /Emoji/)
    })
  })

  it('flags emoji in a .tsx file', async () => {
    await withTmp('tsx', async (dir) => {
      const file = join(dir, 'test.tsx')
      await writeFile(file, 'export const Icon = () => <span>\u{1F4A5}</span>\n')
      const violations = await rule.check([file], {})
      assert.ok(violations.length > 0)
      assert.equal(violations[0].line, 1)
    })
  })

  // ── Symbol (Sm / Sc / So / Sk) ────────────────────────────────────────────

  it('flags arrow glyph \u{25BE} (So, U+25BE)', async () => {
    await withTmp('arrow-glyph', async (dir) => {
      const file = join(dir, 'test.tsx')
      await writeFile(file, 'const btn = <Button>\u{25BE} Open</Button>\n')
      const violations = await rule.check([file], {})
      assert.ok(violations.length > 0)
    })
  })

  it('flags right arrow \u{2192} (Sm, U+2192)', async () => {
    await withTmp('right-arrow', async (dir) => {
      const file = join(dir, 'test.ts')
      await writeFile(file, '// flow: A \u{2192} B\n')
      const violations = await rule.check([file], {})
      assert.ok(violations.length > 0)
    })
  })

  it('flags multiplication sign \u{00D7} (Sm, U+00D7)', async () => {
    await withTmp('mult', async (dir) => {
      const file = join(dir, 'test.ts')
      await writeFile(file, 'const label = "3\u{00D7} faster"\n')
      const violations = await rule.check([file], {})
      assert.ok(violations.length > 0)
      assert.match(violations[0].message, /U\+00D7/)
    })
  })

  it('flags euro sign \u{20AC} (Sc, U+20AC)', async () => {
    await withTmp('euro', async (dir) => {
      const file = join(dir, 'test.ts')
      await writeFile(file, 'const price = "10\u{20AC}"\n')
      const violations = await rule.check([file], {})
      assert.ok(violations.length > 0)
    })
  })

  it('flags check mark \u{2713} (So, U+2713)', async () => {
    await withTmp('check', async (dir) => {
      const file = join(dir, 'test.ts')
      await writeFile(file, 'const ok = "\u{2713} done"\n')
      const violations = await rule.check([file], {})
      assert.ok(violations.length > 0)
    })
  })

  // ── Per-character reporting ───────────────────────────────────────────────

  it('reports one violation per symbol character on the same line', async () => {
    await withTmp('per-char', async (dir) => {
      const file = join(dir, 'test.ts')
      // Two distinct symbols on the same line
      await writeFile(file, 'const x = "\u{2192}\u{2713}"\n')
      const violations = await rule.check([file], {})
      assert.equal(violations.length, 2)
      assert.equal(violations[0].line, 1)
      assert.equal(violations[1].line, 1)
    })
  })

  it('reports violations on the correct line number', async () => {
    await withTmp('line-num', async (dir) => {
      const file = join(dir, 'test.ts')
      await writeFile(file, 'const a = "clean"\nconst b = "\u{1F4A5} boom"\n')
      const violations = await rule.check([file], {})
      assert.ok(violations.length > 0)
      assert.equal(violations[0].line, 2)
    })
  })

  it('includes character and U+XXXX code point in the message', async () => {
    await withTmp('message', async (dir) => {
      const file = join(dir, 'test.ts')
      await writeFile(file, 'const x = "\u{2192}"\n')
      const violations = await rule.check([file], {})
      assert.ok(violations.length > 0)
      assert.match(violations[0].message, /U\+2192/)
    })
  })

  // ── Non-violations ────────────────────────────────────────────────────────

  it('does not flag plain ASCII (letters, operators, punctuation)', async () => {
    await withTmp('ascii', async (dir) => {
      const file = join(dir, 'test.ts')
      await writeFile(file, 'const x = "hello world"; const ok = a < b && c > 0;\n')
      const violations = await rule.check([file], {})
      assert.equal(violations.length, 0)
    })
  })

  it('does not flag ASCII code operators < > = $ `', async () => {
    await withTmp('operators', async (dir) => {
      const file = join(dir, 'test.ts')
      await writeFile(file, 'if (a < b && c >= 0) { const t = `${x}`; }\n')
      const violations = await rule.check([file], {})
      assert.equal(violations.length, 0)
    })
  })

  it('does not flag French accented letters (Latin Extended)', async () => {
    await withTmp('french', async (dir) => {
      const file = join(dir, 'test.ts')
      await writeFile(file, 'const msg = "é è à ç ù â î ô û ë ï ü"\n')
      const violations = await rule.check([file], {})
      assert.equal(violations.length, 0)
    })
  })

  it('does not flag em-dash — (Pd, not Symbol — handled by shared/no-em-dash)', async () => {
    await withTmp('em-dash', async (dir) => {
      const file = join(dir, 'test.ts')
      await writeFile(file, 'const x = "foo \u{2014} bar"\n')
      const violations = await rule.check([file], {})
      assert.equal(violations.length, 0)
    })
  })

  it('returns empty array for empty files list', async () => {
    const violations = await rule.check([], {})
    assert.equal(violations.length, 0)
  })

})
