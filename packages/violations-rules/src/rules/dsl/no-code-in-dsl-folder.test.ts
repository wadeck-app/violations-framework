import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { writeFile, mkdir, mkdtemp, rm } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import { tmpdir } from 'node:os'
import { rule } from './no-code-in-dsl-folder.js'

describe('dsl/no-code-in-dsl-folder', () => {
  async function withFiles(rels: string[]): Promise<[string[], () => Promise<void>]> {
    const dir = await mkdtemp(join(tmpdir(), 'no-code-in-dsl-'))
    const files: string[] = []
    for (const rel of rels) {
      const file = join(dir, 'packages', 'orch-app', 'src', 'dsl', rel)
      await mkdir(dirname(file), { recursive: true })
      await writeFile(file, '')
      files.push(file)
    }
    return [files, () => rm(dir, { recursive: true })]
  }

  it('flags a .tsx file directly in src/dsl/', async () => {
    const [files, cleanup] = await withFiles(['pages/home.yaml', 'KeyedPageRunner.tsx'])
    try {
      const violations = await rule.check(files, {})
      assert.equal(violations.length, 1)
      assert.match(violations[0].file, /KeyedPageRunner\.tsx$/)
      assert.match(violations[0].message, /dsl-renderer/)
    } finally {
      await cleanup()
    }
  })

  it('flags a .ts file at depth', async () => {
    const [files, cleanup] = await withFiles(['pages/home.yaml', 'pages/deep/helper.ts'])
    try {
      const violations = await rule.check(files, {})
      assert.equal(violations.length, 1)
      assert.match(violations[0].file, /helper\.ts$/)
    } finally {
      await cleanup()
    }
  })

  it('does not flag .yaml, .yml or uppercase .YAML', async () => {
    const [files, cleanup] = await withFiles(['pages/a.yaml', 'pages/b.yml', 'pages/c.YAML'])
    try {
      assert.equal((await rule.check(files, {})).length, 0)
    } finally {
      await cleanup()
    }
  })

  it('does not require a pages/ folder (yaml at the dsl root or in any subfolder)', async () => {
    const [files, cleanup] = await withFiles(['a.yaml', 'sub/b.yml'])
    try {
      assert.equal((await rule.check(files, {})).length, 0)
    } finally {
      await cleanup()
    }
  })

  it('ignores files outside a *-app src/dsl folder', async () => {
    assert.equal((await rule.check(['packages/orch-lib/src/dsl/x.ts'], {})).length, 0)
  })

  it('returns empty array when files list is empty', async () => {
    assert.equal((await rule.check([], {})).length, 0)
  })
})
