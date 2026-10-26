// Runs the workspace tests, then sweeps temp directories they may have leaked (killed run, failed
// assertion before a finally). Every test directory is created as <tmpdir>/violations-*.
// Only entries older than MIN_AGE_MS are removed so a concurrent test run is never disturbed.
import { spawnSync } from 'node:child_process'
import { readdirSync, rmSync, statSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

const MIN_AGE_MS = 60 * 60 * 1000

const npmCli = process.env.npm_execpath
if (!npmCli) {
  console.error('[test] npm_execpath is not set: run this script through "npm test".')
  process.exit(2)
}

const run = spawnSync(process.execPath, [npmCli, 'run', 'test:workspaces'], { stdio: 'inherit' })

const root = tmpdir()
const now = Date.now()
let removed = 0
for (const name of readdirSync(root)) {
  if (!name.startsWith('violations-')) continue
  const full = join(root, name)
  try {
    if (now - statSync(full).mtimeMs < MIN_AGE_MS) continue
    rmSync(full, { recursive: true, force: true })
    removed++
  } catch (err) {
    console.error(`[test] could not remove leftover ${full}: ${err instanceof Error ? err.message : String(err)}`)
  }
}
if (removed > 0) console.error(`[test] removed ${removed} leftover violations-* temp dir(s) from ${root}`)

process.exit(run.status ?? 1)
