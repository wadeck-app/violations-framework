import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { writeFile, mkdtemp, rm } from 'node:fs/promises'
import { join } from 'node:path'
import { tmpdir } from 'node:os'
import { rule, type Config } from './no-uppercase-literal.js'

async function run(name: string, content: string, config: Config = {}) {
  const dir = await mkdtemp(join(tmpdir(), 'violations-no-uppercase-literal-'))
  try {
    const file = join(dir, name)
    await writeFile(file, content)
    return await rule.check([file], config)
  } finally {
    await rm(dir, { recursive: true })
  }
}

describe('shared/no-uppercase-literal', () => {
  const positives: Array<[string, string, string]> = [
    ['TS object groupLabel', 'a.ts', "const g = { groupLabel: 'TOOLS' }\n"],
    ['JSX attribute', 'A.tsx', '<Panel title="SETTINGS" />\n'],
    ['JSON', 'a.json', '{ "label": "TOOLS" }\n'],
    ['YAML quoted', 'a.yaml', 'label: "TOOLS"\n'],
    ['YAML bare', 'a.yml', 'caption: TOOLS\n'],
    ['YAML list item', 'a.yml', '- placeholder: SEARCH HERE\n'],
    ['multi-word with a long word', 'a.ts', "const x = { header: 'CPU USAGE' }\n"],
    ['backtick string', 'a.ts', 'const x = { text: `TOOLS` }\n'],
  ]
  for (const [label, name, content] of positives) {
    it(`fires on ${label}`, async () => {
      const v = await run(name, content)
      assert.equal(v.length, 1)
      assert.equal(v[0]!.line, 1)
      assert.match(v[0]!.message, /natural case/)
    })
  }

  const negatives: Array<[string, string, string]> = [
    ['short API', 'a.ts', "const x = { label: 'API' }\n"],
    ['short CPU', 'a.ts', "const x = { label: 'CPU' }\n"],
    ['short ID/URL/SQL', 'a.ts', "const x = { label: 'ID URL SQL' }\n"],
    ['allowed HTTP', 'a.ts', "const x = { label: 'HTTP' }\n"],
    ['allowed acronyms together', 'a.ts', "const x = { label: 'JSON API' }\n"],
    ['natural case', 'a.ts', "const x = { label: 'Tools' }\n"],
    ['SNAKE_CASE constant', 'a.ts', "const x = { label: 'MAX_RETRIES' }\n"],
    ['no letters', 'a.ts', "const x = { label: '1234' }\n"],
    ['other key', 'a.ts', "const x = { kind: 'TOOLS' }\n"],
    ['comment', 'a.ts', "// label: 'TOOLS'\n"],
    ['yaml comment', 'a.yaml', '# label: TOOLS\n'],
    ['yaml short bare', 'a.yaml', 'label: CPU\n'],
    ['story file', 'A.stories.tsx', '<Panel title="SETTINGS" />\n'],
    ['test file', 'a.test.ts', "const x = { label: 'TOOLS' }\n"],
  ]
  for (const [label, name, content] of negatives) {
    it(`does not fire on ${label}`, async () => {
      assert.equal((await run(name, content)).length, 0)
    })
  }

  it('honours allowedAcronyms config (case-insensitive)', async () => {
    assert.equal((await run('a.ts', "const x = { label: 'KAFKA' }\n")).length, 1)
    assert.equal((await run('a.ts', "const x = { label: 'KAFKA' }\n", { allowedAcronyms: ['kafka'] })).length, 0)
  })
})
