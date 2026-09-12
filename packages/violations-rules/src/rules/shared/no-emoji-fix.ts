/**
 * Companion fix script for shared/no-emoji.
 *
 * Usage:
 *   node dist/rules/shared/no-emoji-fix.js [--dry-run] [--root <path>] [--out <json-file>]
 *
 * Modes:
 *   --dry-run   Scan and print proposed changes; write JSON proposals to --out if given.
 *   (default)   Apply changes in place (writes files).
 *
 * Safe zones (auto-fixed):
 *   .ts / .tsx / .cs   comment lines only
 *   .md                all lines
 *
 * Skipped (reported but not fixed):
 *   Non-comment lines in .ts/.tsx/.cs - the symbol may be intentional UI text
 *   (e.g. close-button symbols, caret glyphs, icon glyphs in JSX/strings).
 *
 * Note: .violations/ is excluded from the walk (compiled cache + config files).
 *   Symbols in .violations/config.ts or local rules must be fixed manually.
 *
 * Replacement strategy (comment lines and .md):
 *   Box-drawing U+2550 (=), U+2554/7/A/D/66/69/6C (double corners/crosses) -> '='
 *   Other box-drawing U+2500-U+257F                                         -> '-'
 *   All other symbols / emoji                                               -> '' (removed)
 */

import { readFile, writeFile, readdir } from 'node:fs/promises'
import { join, extname, resolve } from 'node:path'
import { writeFileSync } from 'node:fs'

// --- Types ---

type Change = { line: number; original: string; proposed: string }
type Skipped = { line: number; content: string; reason: string }
type FileProposal = { file: string; changes: Change[]; skipped: Skipped[] }

// --- Constants ---

const SCOPED_EXTS = new Set(['.ts', '.tsx', '.cs'])
const ALL_EXTS = new Set([...SCOPED_EXTS, '.md'])
const SKIP_DIRS = new Set(['node_modules', '.git', 'dist', 'dist-bundle', '.violations'])

// Same regex as the rule: Extended_Pictographic + Symbol categories, ASCII excluded.
const SYMBOL_RE = /\p{Extended_Pictographic}|\p{Symbol}/gu

// Double-line box-drawing code points that map to '='
const DOUBLE_BOX = new Set([
  0x2550, 0x2554, 0x2557, 0x255A, 0x255D, 0x2560, 0x2563, 0x2566, 0x2569, 0x256C,
])

// --- Helpers ---

function replaceSymbol(cp: number): string {
  // Box-drawing block: U+2500-U+257F
  if (cp >= 0x2500 && cp <= 0x257F) {
    return DOUBLE_BOX.has(cp) ? '=' : '-'
  }
  // Everything else (emoji, math symbols, currency, etc.) - strip
  return ''
}

function fixLine(line: string): string {
  SYMBOL_RE.lastIndex = 0
  let result = ''
  let i = 0
  while (i < line.length) {
    const cp = line.codePointAt(i) ?? 0
    const charLen = cp > 0xFFFF ? 2 : 1
    if (cp > 0x007F) {
      const ch = line.slice(i, i + charLen)
      if (SYMBOL_RE.test(ch)) {
        SYMBOL_RE.lastIndex = 0
        result += replaceSymbol(cp)
        i += charLen
        continue
      }
      SYMBOL_RE.lastIndex = 0
    }
    result += line.slice(i, i + charLen)
    i += charLen
  }
  return result
}

function hasSymbol(line: string): boolean {
  SYMBOL_RE.lastIndex = 0
  for (let i = 0; i < line.length; ) {
    const cp = line.codePointAt(i) ?? 0
    const charLen = cp > 0xFFFF ? 2 : 1
    if (cp > 0x007F) {
      const ch = line.slice(i, i + charLen)
      if (SYMBOL_RE.test(ch)) { SYMBOL_RE.lastIndex = 0; return true }
      SYMBOL_RE.lastIndex = 0
    }
    i += charLen
  }
  return false
}

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
    if (!hasSymbol(line)) return line

    const safe = isMd || isCommentLine(line, ext)
    if (safe) {
      const proposed = fixLine(line)
      if (proposed !== line) {
        changes.push({ line: i + 1, original: line, proposed })
      }
      return proposed
    } else {
      skipped.push({
        line: i + 1,
        content: line,
        reason: 'non-comment line - symbol may be intentional UI text (JSX, string literal)',
      })
      return line
    }
  })

  return { fixed: fixed.join('\n'), changes, skipped }
}

// --- Main ---

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
          console.log(`        -> ${c.proposed.trim()}`)
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
  process.stderr.write(`no-emoji-fix: ${String(err)}\n`)
  process.exit(1)
})
