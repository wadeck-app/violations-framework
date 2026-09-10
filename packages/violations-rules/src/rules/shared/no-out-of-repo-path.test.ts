import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { writeFile, mkdtemp, rm } from 'node:fs/promises'
import { join } from 'node:path'
import { tmpdir } from 'node:os'
import { rule } from './no-out-of-repo-path.js'

describe('shared/no-out-of-repo-path', () => {
  it('fires on os.homedir() usage', async () => {
    const dir = await mkdtemp(join(tmpdir(), 'no-out-of-repo-path-'))
    try {
      const file = join(dir, 'test.ts')
      await writeFile(file, 'const home = os.homedir()\n')
      const violations = await rule.check([file], {})
      assert.equal(violations.length, 1)
      assert.equal(violations[0].line, 1)
      assert.match(violations[0].message, /os\.homedir/)
    } finally {
      await rm(dir, { recursive: true })
    }
  })

  it('fires on os.homedir() at the correct line', async () => {
    const dir = await mkdtemp(join(tmpdir(), 'no-out-of-repo-path-'))
    try {
      const file = join(dir, 'test.ts')
      await writeFile(file, 'const a = 1\nconst b = 2\nconst home = os.homedir()\n')
      const violations = await rule.check([file], {})
      assert.equal(violations.length, 1)
      assert.equal(violations[0].line, 3)
    } finally {
      await rm(dir, { recursive: true })
    }
  })

  it('fires on process.env.HOME usage', async () => {
    const dir = await mkdtemp(join(tmpdir(), 'no-out-of-repo-path-'))
    try {
      const file = join(dir, 'test.ts')
      await writeFile(file, 'const h = process.env.HOME\n')
      const violations = await rule.check([file], {})
      assert.equal(violations.length, 1)
      assert.match(violations[0].message, /HOME\/USERPROFILE/)
    } finally {
      await rm(dir, { recursive: true })
    }
  })

  it('fires on process.env.USERPROFILE usage', async () => {
    const dir = await mkdtemp(join(tmpdir(), 'no-out-of-repo-path-'))
    try {
      const file = join(dir, 'test.ts')
      await writeFile(file, 'const h = process.env.USERPROFILE\n')
      const violations = await rule.check([file], {})
      assert.equal(violations.length, 1)
      assert.match(violations[0].message, /HOME\/USERPROFILE/)
    } finally {
      await rm(dir, { recursive: true })
    }
  })

  it('fires on hardcoded Windows path with backslash', async () => {
    const dir = await mkdtemp(join(tmpdir(), 'no-out-of-repo-path-'))
    try {
      const file = join(dir, 'test.ts')
      await writeFile(file, 'const p = "C:\\\\Workspace_Tooling\\\\foo"\n')
      const violations = await rule.check([file], {})
      assert.equal(violations.length, 1)
      assert.match(violations[0].message, /Hardcoded absolute Windows path/)
    } finally {
      await rm(dir, { recursive: true })
    }
  })

  it('fires on hardcoded Windows path with forward slash', async () => {
    const dir = await mkdtemp(join(tmpdir(), 'no-out-of-repo-path-'))
    try {
      const file = join(dir, 'test.ts')
      await writeFile(file, 'const p = "C:/Workspace_Other/"\n')
      const violations = await rule.check([file], {})
      assert.equal(violations.length, 1)
      assert.match(violations[0].message, /Hardcoded absolute Windows path/)
    } finally {
      await rm(dir, { recursive: true })
    }
  })

  it('does not fire on process.env.MY_CUSTOM_PATH', async () => {
    const dir = await mkdtemp(join(tmpdir(), 'no-out-of-repo-path-'))
    try {
      const file = join(dir, 'test.ts')
      await writeFile(file, 'const p = process.env.MY_CUSTOM_PATH\n')
      const violations = await rule.check([file], {})
      assert.equal(violations.length, 0)
    } finally {
      await rm(dir, { recursive: true })
    }
  })

  it('does not fire on __dirname usage', async () => {
    const dir = await mkdtemp(join(tmpdir(), 'no-out-of-repo-path-'))
    try {
      const file = join(dir, 'test.ts')
      await writeFile(file, 'const p = path.join(__dirname, "../utils")\n')
      const violations = await rule.check([file], {})
      assert.equal(violations.length, 0)
    } finally {
      await rm(dir, { recursive: true })
    }
  })

  it('does not fire on plain relative paths', async () => {
    const dir = await mkdtemp(join(tmpdir(), 'no-out-of-repo-path-'))
    try {
      const file = join(dir, 'test.ts')
      await writeFile(file, 'import foo from "../utils"\n')
      const violations = await rule.check([file], {})
      assert.equal(violations.length, 0)
    } finally {
      await rm(dir, { recursive: true })
    }
  })

  it('returns empty array for empty files list', async () => {
    const violations = await rule.check([], {})
    assert.equal(violations.length, 0)
  })
})
