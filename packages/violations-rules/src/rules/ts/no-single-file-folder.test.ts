import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { writeFile, mkdtemp, rm, mkdir } from 'node:fs/promises'
import { join } from 'node:path'
import { tmpdir } from 'node:os'
import { rule } from './no-single-file-folder.js'

describe('ts/no-single-file-folder', () => {
  it('fires when a non-exempt directory has exactly 1 .ts source file', async () => {
    const base = await mkdtemp(join(tmpdir(), 'no-single-file-folder-'))
    try {
      const dir = join(base, 'myFeature')
      await mkdir(dir)
      const file = join(dir, 'MyFeature.ts')
      await writeFile(file, 'export const x = 1\n')
      const violations = await rule.check([file], {})
      assert.equal(violations.length, 1)
      assert.equal(violations[0].line, 1)
      assert.match(violations[0].message, /Folder contains only one source file/)
      assert.match(violations[0].message, /MyFeature\.ts/)
    } finally {
      await rm(base, { recursive: true })
    }
  })

  it('does not fire when a directory has multiple source files', async () => {
    const base = await mkdtemp(join(tmpdir(), 'no-single-file-folder-'))
    try {
      const dir = join(base, 'myFeature')
      await mkdir(dir)
      const file1 = join(dir, 'MyFeature.ts')
      const file2 = join(dir, 'MyFeatureHelper.ts')
      await writeFile(file1, 'export const x = 1\n')
      await writeFile(file2, 'export const y = 2\n')
      const violations = await rule.check([file1, file2], {})
      assert.equal(violations.length, 0)
    } finally {
      await rm(base, { recursive: true })
    }
  })

  it('does not fire when directory name is src', async () => {
    const base = await mkdtemp(join(tmpdir(), 'no-single-file-folder-'))
    try {
      const dir = join(base, 'src')
      await mkdir(dir)
      const file = join(dir, 'MyFeature.ts')
      await writeFile(file, 'export const x = 1\n')
      const violations = await rule.check([file], {})
      assert.equal(violations.length, 0)
    } finally {
      await rm(base, { recursive: true })
    }
  })

  it('does not fire when directory name is in exemptNames', async () => {
    const base = await mkdtemp(join(tmpdir(), 'no-single-file-folder-'))
    try {
      const dir = join(base, 'components')
      await mkdir(dir)
      const file = join(dir, 'MyComponent.ts')
      await writeFile(file, 'export const x = 1\n')
      const violations = await rule.check([file], {})
      assert.equal(violations.length, 0)
    } finally {
      await rm(base, { recursive: true })
    }
  })

  it('does not fire when directory has subdirectories', async () => {
    const base = await mkdtemp(join(tmpdir(), 'no-single-file-folder-'))
    try {
      const dir = join(base, 'myFeature')
      const subdir = join(dir, 'sub')
      await mkdir(dir)
      await mkdir(subdir)
      const file = join(dir, 'MyFeature.ts')
      await writeFile(file, 'export const x = 1\n')
      // Also create a file in subdir so check() sees it in files list
      const subFile = join(subdir, 'Sub.ts')
      await writeFile(subFile, 'export const z = 3\n')
      const violations = await rule.check([file, subFile], {})
      // dir has a subdir, so should NOT fire
      const dirViolation = violations.find((v) => v.file === dir)
      assert.equal(dirViolation, undefined)
    } finally {
      await rm(base, { recursive: true })
    }
  })
})
