import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { writeFile, mkdtemp, rm } from 'node:fs/promises'
import { join } from 'node:path'
import { tmpdir } from 'node:os'
import { rule } from './no-dead-suppress.js'

describe('shared/no-dead-suppress', () => {
  it('fires when a suppress comment references a non-existent rule ID', async () => {
    const dir = await mkdtemp(join(tmpdir(), 'no-dead-suppress-'))
    try {
      const file = join(dir, 'test.ts')
      await writeFile(file, '// violations-suppress: ts/old-deleted-rule\nconst x = 1\n')
      const violations = await rule.check([file], { activeRuleIds: ['ts/no-export-star'] })
      assert.equal(violations.length, 1)
      assert.match(violations[0].message, /ts\/old-deleted-rule/)
    } finally {
      await rm(dir, { recursive: true })
    }
  })

  it('fires on multiple invalid rule IDs in one suppress comment', async () => {
    const dir = await mkdtemp(join(tmpdir(), 'no-dead-suppress-'))
    try {
      const file = join(dir, 'test.ts')
      await writeFile(file, '// violations-suppress: ts/old-rule,shared/gone\nconst x = 1\n')
      const violations = await rule.check([file], { activeRuleIds: [] })
      assert.equal(violations.length, 2)
    } finally {
      await rm(dir, { recursive: true })
    }
  })

  it('does not fire when all suppress rule IDs are active', async () => {
    const dir = await mkdtemp(join(tmpdir(), 'no-dead-suppress-'))
    try {
      const file = join(dir, 'test.ts')
      await writeFile(file, '// violations-suppress: ts/no-export-star\nconst x = 1\n')
      const violations = await rule.check([file], { activeRuleIds: ['ts/no-export-star'] })
      assert.equal(violations.length, 0)
    } finally {
      await rm(dir, { recursive: true })
    }
  })

  it('handles /* comment style suppress', async () => {
    const dir = await mkdtemp(join(tmpdir(), 'no-dead-suppress-'))
    try {
      const file = join(dir, 'test.ts')
      await writeFile(file, '/* violations-suppress: shared/gone */\nconst x = 1\n')
      const violations = await rule.check([file], { activeRuleIds: [] })
      assert.equal(violations.length, 1)
    } finally {
      await rm(dir, { recursive: true })
    }
  })

  it('returns empty array when no suppress comments exist', async () => {
    const dir = await mkdtemp(join(tmpdir(), 'no-dead-suppress-'))
    try {
      const file = join(dir, 'test.ts')
      await writeFile(file, 'const x = 1\nexport function foo() {}\n')
      const violations = await rule.check([file], { activeRuleIds: [] })
      assert.equal(violations.length, 0)
    } finally {
      await rm(dir, { recursive: true })
    }
  })
})
