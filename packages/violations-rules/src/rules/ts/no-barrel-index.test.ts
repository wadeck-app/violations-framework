import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { writeFile, mkdtemp, rm } from 'node:fs/promises'
import { join } from 'node:path'
import { tmpdir } from 'node:os'
import { rule } from './no-barrel-index.js'

describe('ts/no-barrel-index', () => {
  it('fires on a file named index.ts', async () => {
    const dir = await mkdtemp(join(tmpdir(), 'violations-no-barrel-index-'))
    try {
      const file = join(dir, 'index.ts')
      await writeFile(file, "export { Foo } from './Foo'\n")
      const violations = await rule.check([file], {})
      assert.equal(violations.length, 1)
      assert.equal(violations[0].line, 1)
      assert.match(violations[0].message, /Barrel index file/)
    } finally {
      await rm(dir, { recursive: true })
    }
  })

  it('fires on a file named index.tsx', async () => {
    const dir = await mkdtemp(join(tmpdir(), 'violations-no-barrel-index-'))
    try {
      const file = join(dir, 'index.tsx')
      await writeFile(file, "export { Foo } from './Foo'\n")
      const violations = await rule.check([file], {})
      assert.equal(violations.length, 1)
    } finally {
      await rm(dir, { recursive: true })
    }
  })

  it('does not fire on myComponent.ts', async () => {
    const dir = await mkdtemp(join(tmpdir(), 'violations-no-barrel-index-'))
    try {
      const file = join(dir, 'myComponent.ts')
      await writeFile(file, 'export const x = 1\n')
      const violations = await rule.check([file], {})
      assert.equal(violations.length, 0)
    } finally {
      await rm(dir, { recursive: true })
    }
  })

  it('does not fire on the fixed app-module entries (backend, dsl-components, dsl-scenarios), on either separator', async () => {
    const entries = [
      'w/packages/app-module-x/src/backend/index.ts',
      'w\\packages\\app-module-x\\src\\dsl-components\\index.ts',
      'packages/app-module-x/src/dsl-scenarios/index.ts',
    ]
    assert.equal((await rule.check(entries, {})).length, 0)
  })

  it('still fires on other index.ts inside an app-module (commons, nested, dsl-views)', async () => {
    const files = [
      'w/packages/app-module-x/src/commons/index.ts',
      'w/packages/app-module-x/src/dsl-scenarios/sub/index.ts',
      'w/packages/not-a-module/src/backend/index.ts',
    ]
    assert.equal((await rule.check(files, {})).length, 3)
  })

  it('does not fire on indexHelper.ts', async () => {
    const dir = await mkdtemp(join(tmpdir(), 'violations-no-barrel-index-'))
    try {
      const file = join(dir, 'indexHelper.ts')
      await writeFile(file, 'export const x = 1\n')
      const violations = await rule.check([file], {})
      assert.equal(violations.length, 0)
    } finally {
      await rm(dir, { recursive: true })
    }
  })
})
