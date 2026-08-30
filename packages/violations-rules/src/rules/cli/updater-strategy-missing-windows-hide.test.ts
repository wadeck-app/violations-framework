import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { writeFile, mkdtemp, rm } from 'node:fs/promises'
import { join } from 'node:path'
import { tmpdir } from 'node:os'
import { rule } from './updater-strategy-missing-windows-hide.js'

describe('cli/updater-strategy-missing-windows-hide', () => {
  it('fires on Go file that spawns npm via exec.Command without suppression', async () => {
    const dir = await mkdtemp(join(tmpdir(), 'go-update-'))
    try {
      const file = join(dir, 'update.go')
      await writeFile(file, `
package main

func spawnUpdate() {
  cmd := exec.Command("npm", "install", "-g", "@wadeck-app/my-cli@1.0.0")
  cmd.Start()
}
`)
      const violations = await rule.check([file], {})
      assert.equal(violations.length, 1)
      assert.match(violations[0].message, /without-daemon/)
    } finally {
      await rm(dir, { recursive: true })
    }
  })

  it('does not fire when spawnUpdateAndExit helper is present nearby', async () => {
    const dir = await mkdtemp(join(tmpdir(), 'go-update-'))
    try {
      const file = join(dir, 'update.go')
      await writeFile(file, `
package main

func spawnUpdate() {
  // calls spawnUpdateAndExit which uses wscript SW_HIDE
  spawnUpdateAndExit(pkgName, version)
  cmd := exec.Command("npm", "install", "-g", pkgName)
  cmd.Start()
}
`)
      const violations = await rule.check([file], {})
      assert.equal(violations.length, 0)
    } finally {
      await rm(dir, { recursive: true })
    }
  })

  it('does not fire on Go file with no npm usage', async () => {
    const dir = await mkdtemp(join(tmpdir(), 'go-update-'))
    try {
      const file = join(dir, 'launcher.go')
      await writeFile(file, `
package main

func startDaemon() {
  cmd := exec.Command("./daemon")
  cmd.Start()
}
`)
      const violations = await rule.check([file], {})
      assert.equal(violations.length, 0)
    } finally {
      await rm(dir, { recursive: true })
    }
  })
})
