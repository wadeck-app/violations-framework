import { readdir } from 'node:fs/promises'
import type { Dirent } from 'node:fs'
import type { Rule, Violation } from '../types.js'
import { dirname, basename } from 'node:path'

export type Config = {
  exemptNames?: string[]
}

const DEFAULT_EXEMPT_NAMES = [
  'pageRunner',
  '_internal',
  'components',
  'context',
  'types',
  'schemas',
  'hooks',
  'engine',
  'utils',
  'runners',
  'build',
  'mock',
]

const SOURCE_EXT_RE = /\.(ts|tsx)$/
const TEST_OR_STORIES_RE = /\.(test|stories)\.(ts|tsx)$/

export const rule: Rule<Config> = {
  id: 'ts/no-single-file-folder',
  tags: 'ts',
  defaultScope: ['src/**'],
  defaultSeverity: 'warning',

  async check(files: string[], config: Config): Promise<Violation[]> {
    const exemptNames = config.exemptNames ?? DEFAULT_EXEMPT_NAMES
    const violations: Violation[] = []

    // Group files by their parent directory
    const byDir = new Map<string, string[]>()
    for (const file of files) {
      const dir = dirname(file)
      const existing = byDir.get(dir)
      if (existing) {
        existing.push(file)
      } else {
        byDir.set(dir, [file])
      }
    }

    for (const [dir, dirFiles] of byDir) {
      const dirName = basename(dir)

      // Skip src/ root
      if (dirName === 'src') continue

      // Skip exempt names
      if (exemptNames.includes(dirName)) continue

      // Count source files (ts/tsx, not test, not stories)
      const sourceFiles = dirFiles.filter(
        (f) => SOURCE_EXT_RE.test(f) && !TEST_OR_STORIES_RE.test(f),
      )
      if (sourceFiles.length !== 1) continue

      // Check for subdirectories
      let entries: Dirent[]
      try {
        entries = await readdir(dir, { withFileTypes: true }) as Dirent[]
      } catch {
        continue
      }
      const hasSubdirs = entries.some((e) => e.isDirectory())
      if (hasSubdirs) continue

      violations.push({
        file: dir,
        line: 1,
        message: `Folder contains only one source file (${basename(sourceFiles[0])}) - move it to the parent and delete the folder`,
      })
    }

    return violations
  },
}
