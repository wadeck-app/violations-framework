import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { writeFile, mkdtemp, rm, mkdir } from 'node:fs/promises'
import { join } from 'node:path'
import { tmpdir } from 'node:os'
import { rule } from './no-dead-rule-scope.js'

describe('violations-meta/no-dead-rule-scope', () => {
  it('fires when a rule file has a defaultScope pointing to a non-existent path', async () => {
    const dir = await mkdtemp(join(tmpdir(), 'no-dead-scope-'))
    try {
      const ruleFile = join(dir, 'my-rule.ts')
      await writeFile(ruleFile, `
export const rule = {
  id: 'ts/test-rule',
  tags: 'ts',
  defaultScope: ['packages/nonexistent-dir/**/*.ts'],
  defaultSeverity: 'error',
  async check() { return [] }
}
`)
      const violations = await rule.check([], {
        ruleFiles: [ruleFile],
        projectRoot: dir,
      })
      assert.equal(violations.length, 1)
      assert.match(violations[0].message, /Dead rule scope/)
    } finally {
      await rm(dir, { recursive: true })
    }
  })

  it('does not fire when a rule file has a defaultScope pointing to an existing path', async () => {
    const dir = await mkdtemp(join(tmpdir(), 'no-dead-scope-'))
    try {
      await mkdir(join(dir, 'packages', 'my-pkg', 'src'), { recursive: true })
      const ruleFile = join(dir, 'my-rule.ts')
      await writeFile(ruleFile, `
export const rule = {
  id: 'ts/test-rule',
  tags: 'ts',
  defaultScope: ['packages/my-pkg/src/**/*.ts'],
  defaultSeverity: 'error',
  async check() { return [] }
}
`)
      const violations = await rule.check([], {
        ruleFiles: [ruleFile],
        projectRoot: dir,
      })
      assert.equal(violations.length, 0)
    } finally {
      await rm(dir, { recursive: true })
    }
  })

  it('skips rule files with no defaultScope array (dynamic scan rules)', async () => {
    const dir = await mkdtemp(join(tmpdir(), 'no-dead-scope-'))
    try {
      const ruleFile = join(dir, 'dynamic-rule.ts')
      await writeFile(ruleFile, `
export const rule = {
  id: 'violations-meta/no-dead-rule-scope',
  tags: 'violations-meta',
  defaultSeverity: 'error',
  async check() { return [] }
}
`)
      const violations = await rule.check([], {
        ruleFiles: [ruleFile],
        projectRoot: dir,
      })
      assert.equal(violations.length, 0)
    } finally {
      await rm(dir, { recursive: true })
    }
  })

  it('returns empty array when ruleFiles is empty', async () => {
    const violations = await rule.check([], { ruleFiles: [] })
    assert.equal(violations.length, 0)
  })
})
