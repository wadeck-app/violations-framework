import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { mkdtemp, mkdir, writeFile, rm } from 'node:fs/promises'
import { join } from 'node:path'
import { tmpdir } from 'node:os'
import { rule } from './no-react.js'

describe('app-module/no-react', () => {
  async function setup(): Promise<{ dir: string; fileBase: string }> {
    const dir = await mkdtemp(join(tmpdir(), 'no-react-'))
    const appModuleDir = join(dir, 'packages', 'app-module-fake', 'api-backend')
    await mkdir(appModuleDir, { recursive: true })
    return { dir, fileBase: appModuleDir }
  }

  it('flags any .tsx file outright', async () => {
    const { dir, fileBase } = await setup()
    try {
      const file = join(fileBase, 'Widget.tsx')
      await writeFile(file, 'export const x = 1;\n')
      const violations = await rule.check([file], {})
      assert.equal(violations.length, 1)
      assert.match(violations[0].message, /\.tsx/)
    } finally {
      await rm(dir, { recursive: true })
    }
  })

  it('flags a react import in a .ts file', async () => {
    const { dir, fileBase } = await setup()
    try {
      const file = join(fileBase, 'index.ts')
      await writeFile(file, "import { useState } from 'react';\n")
      const violations = await rule.check([file], {})
      assert.equal(violations.length, 1)
      assert.match(violations[0].message, /react/)
    } finally {
      await rm(dir, { recursive: true })
    }
  })

  it('does not flag plain backend code with no react usage', async () => {
    const { dir, fileBase } = await setup()
    try {
      const file = join(fileBase, 'index.ts')
      await writeFile(file, "export default function (ctx) { ctx.registerRoute('GET', '/x', () => ({})); }\n")
      const violations = await rule.check([file], {})
      assert.equal(violations.length, 0)
    } finally {
      await rm(dir, { recursive: true })
    }
  })

  it('ignores test files', async () => {
    const { dir, fileBase } = await setup()
    try {
      const file = join(fileBase, 'index.test.ts')
      await writeFile(file, "import { useState } from 'react';\n")
      const violations = await rule.check([file], {})
      assert.equal(violations.length, 0)
    } finally {
      await rm(dir, { recursive: true })
    }
  })
})
