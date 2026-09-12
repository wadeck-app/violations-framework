/**
 * Companion fix script for shared/no-em-dash.
 *
 * Usage:
 *   node dist/rules/shared/no-em-dash-fix.js [--dry-run] [--root <path>] [--out <json-file>]
 *
 * Modes:
 *   --dry-run   Scan and print proposed changes; write JSON proposals to --out if given.
 *   (default)   Apply changes in place (writes files).
 *
 * Safe zones (auto-fixed):
 *   .ts / .tsx / .js / .cs / .yaml / .shader / .md   comment lines only
 *   .md                                               all lines
 *
 * Skipped (reported but not fixed):
 *   Non-comment lines in .ts/.tsx/.js/.cs/.yaml/.shader — the dash may be intentional
 *   user-visible text (labels, log messages, UI strings).
 *
 * Note: .violations/ is excluded from the walk (compiled cache + config files).
 *   Dashes in .violations/config.ts or local rules must be fixed manually.
 */

import { readFile, writeFile, readdir } from 'node:fs/promises'
import { join, extname, resolve } from 'node:path'
import { writeFileSync } from 'node:fs'

// ─── Types ────────────────────────────────────────────────────────────────────

type Change = { line: number; original: string; proposed: string }
type Skipped = { line: number; content: string; reason: string }
type FileProposal = { file: string; changes: Change[]; skipped: Skipped[] }

// ─── Constants ────────────────────────────────────────────────────────────────

const SCOPED_EXTS = new Set(['.ts', '.tsx', '.js', '.cs', '.yaml', '.shader'])
const ALL_EXTS = new Set([...SCOPED_EXTS, '.md'])
const DASH_RE = /[—–]/g
const SKIP_DIRS = new Set(['node_modules', '.git', 'dist', 'dist-bundle', '.violations'])

// ─── Helpers ─────────────────────────────────────────────────────────────────

function isCommentLine(line: string, ext: string): boolean {
  const t = line.trimStart()
  if (ext === '.yaml') return t.startsWith('#')
  return t.startsWith('//') || t.startsWith('/*') || t.startsWith('*')
}

async function* walkFiles(dir: string): AsyncGenerator<string> {
  const entries = await readdir(dir, { withFileTypes: true })
  for (const entry of entries) {
    const full = join(dir, entry.name)
    if (entry.isDirectory()) {
      if (!SKIP_DIRS.has(entry.name)) yield* walkFiles(full)
    } else if (entry.isFile() && ALL_EXTS.has(extname(entry.name))) {
      yield full
    }
  }
}

function processFile(content: string, file: string): { fixed: string; changes: Change[]; skipped: Skipped[] } {
  const ext = extname(file)
  const isMd = ext === '.md'
  const lines = content.split('\n')
  const changes: Change[] = []
  const skipped: Skipped[] = []

  const fixed = lines.map((line, i) => {
    if (!DASH_RE.test(line)) return line
    DASH_RE.lastIndex = 0

    const safe = isMd || isCommentLine(line, ext)
    if (safe) {
      const proposed = line.replace(DASH_RE, '-')
      if (proposed !== line) {
        changes.push({ line: i + 1, original: line, proposed })
      }
      return proposed
    } else {
      skipped.push({
        line: i + 1,
        content: line,
        reason: 'non-comment line — dash may be intentional user-visible text',
      })
      return line
    }
  })

  return { fixed: fixed.join('\n'), changes, skipped }
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main(): Promise<void> {
  const args = process.argv.slice(2)
  const dryRun = args.includes('--dry-run')
  const rootIdx = args.indexOf('--root')
  const root = resolve(rootIdx !== -1 && args[rootIdx + 1] ? args[rootIdx + 1]! : '.')
  const outIdx = args.indexOf('--out')
  const outFile = outIdx !== -1 && args[outIdx + 1] ? args[outIdx + 1]! : undefined

  let totalChanges = 0
  let totalSkipped = 0
  const proposals: FileProposal[] = []

  for await (const file of walkFiles(root)) {
    const content = await readFile(file, 'utf8').catch(() => null)
    if (content === null) continue

    const { fixed, changes, skipped } = processFile(content, file)
    if (changes.length === 0 && skipped.length === 0) continue

    totalChanges += changes.length
    totalSkipped += skipped.length
    proposals.push({ file, changes, skipped })

    if (dryRun) {
      const rel = file.startsWith(root) ? file.slice(root.length + 1) : file
      if (changes.length > 0) {
        console.log(`\n[propose] ${rel}`)
        for (const c of changes) {
          console.log(`  line ${c.line}: ${c.original.trim()}`)
          console.log(`        → ${c.proposed.trim()}`)
        }
      }
      if (skipped.length > 0) {
        console.log(`[skip]    ${rel}`)
        for (const s of skipped) {
          console.log(`  line ${s.line}: ${s.reason}`)
        }
      }
    } else {
      const rel = file.startsWith(root) ? file.slice(root.length + 1) : file
      if (changes.length > 0) {
        await writeFile(file, fixed, 'utf8')
        console.log(`[fixed]   ${rel}  (${changes.length} change${changes.length === 1 ? '' : 's'})`)
      }
      if (skipped.length > 0) {
        console.log(`[skip]    ${rel}  (${skipped.length} line${skipped.length === 1 ? '' : 's'} need manual review)`)
        for (const s of skipped) {
          console.log(`  line ${s.line}: ${s.reason}`)
        }
      }
    }
  }

  if (dryRun && outFile) {
    writeFileSync(outFile, JSON.stringify(proposals, null, 2), 'utf8')
    console.log(`\n[out]     ${outFile}`)
  }

  console.log(
    dryRun
      ? `\nDry-run: ${totalChanges} proposed change${totalChanges === 1 ? '' : 's'}, ${totalSkipped} skipped (manual review needed)`
      : `\nApplied: ${totalChanges} change${totalChanges === 1 ? '' : 's'}, ${totalSkipped} skipped (manual review needed)`
  )
}

main().catch(err => {
  process.stderr.write(`no-em-dash-fix: ${String(err)}\n`)
  process.exit(1)
})
