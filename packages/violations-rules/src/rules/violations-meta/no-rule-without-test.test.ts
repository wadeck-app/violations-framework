import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { writeFile, mkdtemp, rm } from 'node:fs/promises'
import { join } from 'node:path'
import { tmpdir } from 'node:os'
import { rule } from './no-rule-without-test.js'

describe('violations-meta/no-rule-without-test', () => {
  it('fires when a rule file has no corresponding test file', async () => {
    const dir = await mkdtemp(join(tmpdir(), 'no-rule-without-test-'))
    try {
      const ruleFile = join(dir, 'my-rule.ts')
      await writeFile(ruleFile, 'export const rule = {}')
      const violations = await rule.check([], { ruleFiles: [ruleFile] })
      assert.equal(violations.length, 1)
      assert.match(violations[0].message, /my-rule/)
    } finally {
      await rm(dir, { recursive: true })
    }
  })

  it('does not fire when a .test.ts file exists alongside the rule', async () => {
    const dir = await mkdtemp(join(tmpdir(), 'no-rule-without-test-'))
    try {
      const ruleFile = join(dir, 'my-rule.ts')
      const testFile = join(dir, 'my-rule.test.ts')
      await writeFile(ruleFile, 'export const rule = {}')
      await writeFile(testFile, 'import { describe } from "node:test"')
      const violations = await rule.check([], { ruleFiles: [ruleFile] })
      assert.equal(violations.length, 0)
    } finally {
      await rm(dir, { recursive: true })
    }
  })

  it('does not fire when a .test.js file exists alongside the rule', async () => {
    const dir = await mkdtemp(join(tmpdir(), 'no-rule-without-test-'))
    try {
      const ruleFile = join(dir, 'my-rule.ts')
      const testFile = join(dir, 'my-rule.test.js')
      await writeFile(ruleFile, 'export const rule = {}')
      await writeFile(testFile, '// test')
      const violations = await rule.check([], { ruleFiles: [ruleFile] })
      assert.equal(violations.length, 0)
    } finally {
      await rm(dir, { recursive: true })
    }
  })

  it('skips .test.ts files themselves', async () => {
    const dir = await mkdtemp(join(tmpdir(), 'no-rule-without-test-'))
    try {
      const testFile = join(dir, 'my-rule.test.ts')
      await writeFile(testFile, '// test')
      const violations = await rule.check([], { ruleFiles: [testFile] })
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
