import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { writeFile, mkdtemp, rm } from 'node:fs/promises'
import { join } from 'node:path'
import { tmpdir } from 'node:os'
import { rule } from './no-uppercase-text.js'

async function run(name: string, content: string) {
  const dir = await mkdtemp(join(tmpdir(), 'violations-no-uppercase-'))
  try {
    const file = join(dir, name)
    await writeFile(file, content)
    return await rule.check([file], {})
  } finally {
    await rm(dir, { recursive: true })
  }
}

describe('shared/no-uppercase-text', () => {
  const positives: Array<[string, string, string]> = [
    ['tailwind class', 'A.tsx', '<span className="text-xs uppercase tracking-wide">x</span>\n'],
    ['tailwind variant', 'A.tsx', '<span className="md:uppercase">x</span>\n'],
    ['cn() call', 'A.tsx', "const c = cn('uppercase', active && 'font-bold')\n"],
    ['css text-transform', 'a.css', '.cap { text-transform: uppercase; }\n'],
    ['react style object', 'A.tsx', "const s = { textTransform: 'uppercase' }\n"],
    ['arbitrary tailwind property', 'A.tsx', '<i className="[text-transform:uppercase]" />\n'],
    ['font-variant small-caps', 'a.css', '.cap { font-variant: small-caps; }\n'],
    ['font-variant-caps', 'a.css', '.cap { font-variant-caps: all-small-caps; }\n'],
    ['smcp feature', 'a.css', '.cap { font-feature-settings: "smcp" 1; }\n'],
  ]
  for (const [label, name, content] of positives) {
    it(`fires on ${label}`, async () => {
      const v = await run(name, content)
      assert.equal(v.length, 1)
      assert.equal(v[0]!.line, 1)
      assert.match(v[0]!.message, /readability/)
    })
  }

  const negatives: Array<[string, string, string]> = [
    ['normal-case', 'A.tsx', '<span className="normal-case">x</span>\n'],
    ['text-transform none', 'a.css', '.x { text-transform: none; }\n'],
    ['text-transform capitalize', 'a.css', '.x { text-transform: capitalize; }\n'],
    ['prose in a string', 'A.ts', "const msg = 'the id must be uppercase'\n"],
    ['comment', 'A.ts', '// text-transform: uppercase is banned\n'],
    ['font-variant normal', 'a.css', '.x { font-variant: normal; }\n'],
    ['story file', 'A.stories.tsx', '<span className="uppercase">x</span>\n'],
    ['test file', 'A.test.tsx', '<span className="uppercase">x</span>\n'],
  ]
  for (const [label, name, content] of negatives) {
    it(`does not fire on ${label}`, async () => {
      assert.equal((await run(name, content)).length, 0)
    })
  }
})
