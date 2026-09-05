import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { writeFile, mkdtemp, rm } from 'node:fs/promises'
import { join } from 'node:path'
import { tmpdir } from 'node:os'
import { rule } from './no-spawn-without-windows-hide.js'

describe('cli/no-spawn-without-windows-hide', () => {
  async function withFile(name: string, content: string): Promise<[string, () => Promise<void>]> {
    const dir = await mkdtemp(join(tmpdir(), 'spawn-wh-'))
    const file = join(dir, name)
    await writeFile(file, content)
    return [file, () => rm(dir, { recursive: true })]
  }

  // --- spawn() ---

  it('flags spawn() without windowsHide', async () => {
    const [file, cleanup] = await withFile('bad.ts', `
const child = spawn(command, args, {
  shell: true,
  stdio: ['ignore', 'pipe', 'pipe'],
})
`)
    try {
      const violations = await rule.check([file], {})
      assert.equal(violations.length, 1)
      assert.match(violations[0].message, /windowsHide/)
    } finally {
      await cleanup()
    }
  })

  it('does not flag spawn() with windowsHide:true', async () => {
    const [file, cleanup] = await withFile('good.ts', `
const child = spawn(command, args, {
  shell: true,
  windowsHide: true,
})
`)
    try {
      const violations = await rule.check([file], {})
      assert.equal(violations.length, 0)
    } finally {
      await cleanup()
    }
  })

  it('flags spawn() with stdio:inherit when windowsHide is absent (suppress explicitly)', async () => {
    const [file, cleanup] = await withFile('interactive.ts', `
const child = spawn(command, args, {
  stdio: 'inherit',
})
`)
    try {
      const violations = await rule.check([file], {})
      assert.equal(violations.length, 1)
    } finally {
      await cleanup()
    }
  })

  // --- spawnSync() ---

  it('flags spawnSync() without windowsHide', async () => {
    const [file, cleanup] = await withFile('sync.ts', `
const result = spawnSync('git', ['status'], { encoding: 'utf8' })
`)
    try {
      const violations = await rule.check([file], {})
      assert.equal(violations.length, 1)
    } finally {
      await cleanup()
    }
  })

  it('does not flag spawnSync() with windowsHide:true (multiline)', async () => {
    const [file, cleanup] = await withFile('sync-ok.ts', `
const result = spawnSync('git', ['status'], {
  encoding: 'utf8',
  windowsHide: true,
})
`)
    try {
      const violations = await rule.check([file], {})
      assert.equal(violations.length, 0)
    } finally {
      await cleanup()
    }
  })

  // --- execFile() ---

  it('flags execFile() without windowsHide', async () => {
    const [file, cleanup] = await withFile('ef.ts', `
execFile('node', ['script.js'], { encoding: 'utf8' }, callback)
`)
    try {
      const violations = await rule.check([file], {})
      assert.equal(violations.length, 1)
    } finally {
      await cleanup()
    }
  })

  it('does not flag execFile() with windowsHide:true', async () => {
    const [file, cleanup] = await withFile('ef-ok.ts', `
execFile('node', ['script.js'], { encoding: 'utf8', windowsHide: true }, callback)
`)
    try {
      const violations = await rule.check([file], {})
      assert.equal(violations.length, 0)
    } finally {
      await cleanup()
    }
  })

  // --- execFileSync() ---

  it('flags execFileSync() without windowsHide', async () => {
    const [file, cleanup] = await withFile('efs.ts', `
execFileSync('npm', ['install'], { cwd: dir })
`)
    try {
      const violations = await rule.check([file], {})
      assert.equal(violations.length, 1)
    } finally {
      await cleanup()
    }
  })

  it('does not flag execFileSync() with windowsHide:true', async () => {
    const [file, cleanup] = await withFile('efs-ok.ts', `
execFileSync('npm', ['install'], { cwd: dir, windowsHide: true })
`)
    try {
      const violations = await rule.check([file], {})
      assert.equal(violations.length, 0)
    } finally {
      await cleanup()
    }
  })

  // --- skips test files ---

  it('skips .test.ts files', async () => {
    const [file, cleanup] = await withFile('foo.test.ts', `
const child = spawn(command, args, { shell: true })
`)
    try {
      const violations = await rule.check([file], {})
      assert.equal(violations.length, 0)
    } finally {
      await cleanup()
    }
  })

  it('returns empty array when files list is empty', async () => {
    const violations = await rule.check([], {})
    assert.equal(violations.length, 0)
  })
})
