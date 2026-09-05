import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { writeFile, mkdir, mkdtemp, rm } from 'node:fs/promises'
import { join } from 'node:path'
import { tmpdir } from 'node:os'
import { rule } from './no-app-components.js'

describe('dsl/no-app-components', () => {
  async function withAppComponent(name: string): Promise<[string, () => Promise<void>]> {
    const dir = await mkdtemp(join(tmpdir(), 'no-app-components-'))
    const compDir = join(dir, 'packages', 'orch-app', 'src', 'components')
    await mkdir(compDir, { recursive: true })
    const file = join(compDir, name)
    await writeFile(file, '<div />')
    return [file, () => rm(dir, { recursive: true })]
  }

  it('flags a .tsx file in *-app/src/components/', async () => {
    const [file, cleanup] = await withAppComponent('NavBar.tsx')
    try {
      const violations = await rule.check([file], {})
      assert.equal(violations.length, 1)
      assert.equal(violations[0].line, 1)
      assert.match(violations[0].message, /NavBar\.tsx/)
      assert.match(violations[0].message, /\*-ui/)
    } finally {
      await cleanup()
    }
  })

  it('flags a .ts file in *-app/src/components/', async () => {
    const [file, cleanup] = await withAppComponent('helpers.ts')
    try {
      const violations = await rule.check([file], {})
      assert.equal(violations.length, 1)
    } finally {
      await cleanup()
    }
  })

  it('flags multiple files - one violation per file', async () => {
    const dir = await mkdtemp(join(tmpdir(), 'no-app-components-'))
    try {
      const compDir = join(dir, 'packages', 'orch-app', 'src', 'components')
      await mkdir(compDir, { recursive: true })
      const f1 = join(compDir, 'NavBar.tsx')
      const f2 = join(compDir, 'Sidebar.tsx')
      await writeFile(f1, '<div />')
      await writeFile(f2, '<div />')
      const violations = await rule.check([f1, f2], {})
      assert.equal(violations.length, 2)
    } finally {
      await rm(dir, { recursive: true })
    }
  })

  it('returns empty array when files list is empty', async () => {
    const violations = await rule.check([], {})
    assert.equal(violations.length, 0)
  })
})
