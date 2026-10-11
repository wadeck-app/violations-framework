import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { writeFile, mkdir, mkdtemp, rm } from 'node:fs/promises'
import { join } from 'node:path'
import { tmpdir } from 'node:os'
import { rule } from './no-app-ui-outside-shell.js'

describe('dsl/no-app-ui-outside-shell', () => {
  async function withAppFile(relPath: string, content: string): Promise<[string, () => Promise<void>]> {
    const dir = await mkdtemp(join(tmpdir(), 'no-app-ui-outside-shell-'))
    const file = join(dir, 'packages', 'orch-app', 'src', relPath)
    await mkdir(join(file, '..'), { recursive: true })
    await writeFile(file, content)
    return [file, () => rm(dir, { recursive: true })]
  }

  it('flags createContext in a loose file', async () => {
    const [file, cleanup] = await withAppFile(
      'context/ThemeContext.ts',
      "import React from 'react';\nexport const ThemeContext = React.createContext(null);",
    )
    try {
      const violations = await rule.check([file], {})
      assert.equal(violations.length, 1)
      assert.match(violations[0].message, /orch-app/)
    } finally {
      await cleanup()
    }
  })

  it('flags an exported PascalCase component in a loose file', async () => {
    const [file, cleanup] = await withAppFile(
      'NavBadge.tsx',
      "import React from 'react';\nexport function NavBadge() { return <span />; }",
    )
    try {
      const violations = await rule.check([file], {})
      assert.equal(violations.length, 1)
    } finally {
      await cleanup()
    }
  })

  it('does not flag a re-export shim', async () => {
    const [file, cleanup] = await withAppFile(
      'context/ThemeContext.ts',
      "// Re-exported from ui-orch — source of truth has moved there.\nexport { ThemeContext } from 'ui-orch';",
    )
    try {
      const violations = await rule.check([file], {})
      assert.equal(violations.length, 0)
    } finally {
      await cleanup()
    }
  })

  it('does not flag main.tsx, App.tsx or registry.ts', async () => {
    const [file1, cleanup1] = await withAppFile('main.tsx', 'export function App() { return null; }')
    const [file2, cleanup2] = await withAppFile('App.tsx', 'export function App() { return null; }')
    const [file3, cleanup3] = await withAppFile('registry.ts', 'export function buildRegistry() { return {}; }')
    try {
      const violations = await rule.check([file1, file2, file3], {})
      assert.equal(violations.length, 0)
    } finally {
      await cleanup1()
      await cleanup2()
      await cleanup3()
    }
  })

  it('does not flag build/, generated/, dsl/, mock/, runners/', async () => {
    const files: string[] = []
    const cleanups: Array<() => Promise<void>> = []
    for (const dir of ['build', 'generated', 'dsl', 'mock', 'runners']) {
      const [file, cleanup] = await withAppFile(
        `${dir}/Thing.ts`,
        'export function SomeHelper() { return null; }',
      )
      files.push(file)
      cleanups.push(cleanup)
    }
    try {
      const violations = await rule.check(files, {})
      assert.equal(violations.length, 0)
    } finally {
      for (const cleanup of cleanups) {
        await cleanup()
      }
    }
  })

  it('does not flag components/ (covered by dsl/no-app-components instead)', async () => {
    const [file, cleanup] = await withAppFile(
      'components/NavBadge.tsx',
      "export function NavBadge() { return null; }",
    )
    try {
      const violations = await rule.check([file], {})
      assert.equal(violations.length, 0)
    } finally {
      await cleanup()
    }
  })

  it('does not flag a non-UI file in a loose location', async () => {
    const [file, cleanup] = await withAppFile('utils/formatDate.ts', 'export function formatDate(d: Date) { return d.toISOString(); }')
    try {
      const violations = await rule.check([file], {})
      assert.equal(violations.length, 0)
    } finally {
      await cleanup()
    }
  })

  it('ignores files outside any *-app package', async () => {
    const dir = await mkdtemp(join(tmpdir(), 'no-app-ui-outside-shell-'))
    const file = join(dir, 'packages', 'dsl-ui', 'src', 'components', 'NavBadge.tsx')
    await mkdir(join(file, '..'), { recursive: true })
    await writeFile(file, "export function NavBadge() { return null; }")
    try {
      const violations = await rule.check([file], {})
      assert.equal(violations.length, 0)
    } finally {
      await rm(dir, { recursive: true })
    }
  })

  it('returns empty array when files list is empty', async () => {
    const violations = await rule.check([], {})
    assert.equal(violations.length, 0)
  })
})
