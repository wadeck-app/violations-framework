import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { writeFile, mkdtemp, rm } from 'node:fs/promises'
import { join } from 'node:path'
import { tmpdir } from 'node:os'
import { rule } from './daemon-spawn-no-windows-hide.js'

describe('cli/daemon-spawn-no-windows-hide', () => {
  // --- spawn() with detached:true ---

  it('fires when detached:true is present without windowsHide', async () => {
    const dir = await mkdtemp(join(tmpdir(), 'spawn-test-'))
    try {
      const file = join(dir, 'test.ts')
      await writeFile(file, `
const child = spawn(process.execPath, [script], {
  detached: true,
  stdio: 'ignore',
  env: { ...process.env },
})
child.unref()
`)
      const violations = await rule.check([file], {})
      assert.equal(violations.length, 1)
      assert.match(violations[0].message, /windowsHide/)
    } finally {
      await rm(dir, { recursive: true })
    }
  })

  it('does not fire when windowsHide:true is present alongside detached:true', async () => {
    const dir = await mkdtemp(join(tmpdir(), 'spawn-test-'))
    try {
      const file = join(dir, 'test.ts')
      await writeFile(file, `
const child = spawn(process.execPath, [script], {
  detached: true,
  stdio: 'ignore',
  windowsHide: true,
  env: { ...process.env },
})
child.unref()
`)
      const violations = await rule.check([file], {})
      assert.equal(violations.length, 0)
    } finally {
      await rm(dir, { recursive: true })
    }
  })

  it('does not fire when detached:true is absent', async () => {
    const dir = await mkdtemp(join(tmpdir(), 'spawn-test-'))
    try {
      const file = join(dir, 'test.ts')
      await writeFile(file, `
const child = spawn(process.execPath, [script], {
  stdio: 'inherit',
})
`)
      const violations = await rule.check([file], {})
      assert.equal(violations.length, 0)
    } finally {
      await rm(dir, { recursive: true })
    }
  })

  // --- execSync() ---

  it('fires when execSync is missing windowsHide:true', async () => {
    const dir = await mkdtemp(join(tmpdir(), 'exec-test-'))
    try {
      const file = join(dir, 'test.ts')
      await writeFile(file, `
const result = execSync('git rev-list --count HEAD', { encoding: 'utf8' })
`)
      const violations = await rule.check([file], {})
      assert.equal(violations.length, 1)
      assert.match(violations[0].message, /windowsHide/)
    } finally {
      await rm(dir, { recursive: true })
    }
  })

  it('does not fire when execSync has windowsHide:true', async () => {
    const dir = await mkdtemp(join(tmpdir(), 'exec-test-'))
    try {
      const file = join(dir, 'test.ts')
      await writeFile(file, `
const result = execSync('git rev-list --count HEAD', { encoding: 'utf8', windowsHide: true })
`)
      const violations = await rule.check([file], {})
      assert.equal(violations.length, 0)
    } finally {
      await rm(dir, { recursive: true })
    }
  })

  // --- execFileSync() ---

  it('fires when execFileSync is missing windowsHide:true', async () => {
    const dir = await mkdtemp(join(tmpdir(), 'exec-test-'))
    try {
      const file = join(dir, 'test.ts')
      await writeFile(file, `
execFileSync('npm', ['install'], { cwd: dir })
`)
      const violations = await rule.check([file], {})
      assert.equal(violations.length, 1)
      assert.match(violations[0].message, /windowsHide/)
    } finally {
      await rm(dir, { recursive: true })
    }
  })

  it('does not fire when execFileSync has windowsHide:true (multiline options)', async () => {
    const dir = await mkdtemp(join(tmpdir(), 'exec-test-'))
    try {
      const file = join(dir, 'test.ts')
      await writeFile(file, `
execFileSync('npm', ['install'], {
  cwd: dir,
  windowsHide: true,
})
`)
      const violations = await rule.check([file], {})
      assert.equal(violations.length, 0)
    } finally {
      await rm(dir, { recursive: true })
    }
  })

  // --- execFile() ---

  it('fires when execFile is missing windowsHide:true', async () => {
    const dir = await mkdtemp(join(tmpdir(), 'exec-test-'))
    try {
      const file = join(dir, 'test.ts')
      await writeFile(file, `
execFile('reg', ['query', key], { encoding: 'utf8' }, (err, stdout) => {
  resolve(stdout)
})
`)
      const violations = await rule.check([file], {})
      assert.equal(violations.length, 1)
      assert.match(violations[0].message, /windowsHide/)
    } finally {
      await rm(dir, { recursive: true })
    }
  })

  it('does not fire when execFile has windowsHide:true', async () => {
    const dir = await mkdtemp(join(tmpdir(), 'exec-test-'))
    try {
      const file = join(dir, 'test.ts')
      await writeFile(file, `
execFile('reg', ['query', key], { encoding: 'utf8', windowsHide: true }, (err, stdout) => {
  resolve(stdout)
})
`)
      const violations = await rule.check([file], {})
      assert.equal(violations.length, 0)
    } finally {
      await rm(dir, { recursive: true })
    }
  })
})
