import { readFile } from 'node:fs/promises'
import { existsSync, statSync } from 'node:fs'
import { join } from 'node:path'
import type { Rule, Violation } from '../../types.js'

export type Config = {
  ruleFiles: string[]
  /** Project root used for glob resolution. Defaults to process.cwd(). */
  projectRoot?: string
}

// Matches the defaultScope array declaration (may span multiple lines)
const SCOPE_BLOCK_RE = /defaultScope\s*:\s*\[([\s\S]*?)\]/
// Matches individual quoted string entries inside the array
const QUOTED_STRING_RE = /['"]([^'"]+)['"]/g

/**
 * Extract the glob patterns declared in the `defaultScope` array of a rule file's source text.
 * Returns null if no `defaultScope` array is found.
 */
function extractDefaultScope(source: string): string[] | null {
  const match = SCOPE_BLOCK_RE.exec(source)
  if (!match) return null
  const arrayBody = match[1]
  const paths: string[] = []
  let m: RegExpExecArray | null
  QUOTED_STRING_RE.lastIndex = 0
  while ((m = QUOTED_STRING_RE.exec(arrayBody)) !== null) {
    paths.push(m[1])
  }
  return paths
}

/**
 * Very lightweight check: does the pattern (interpreted as a path prefix before the first
 * glob character) resolve to an existing file or directory under projectRoot?
 *
 * For full glob resolution the runner would use micromatch/fast-glob; here we only need to
 * detect obviously dead paths (e.g. `packages/dsl-renderer/src` when that dir was deleted).
 * We strip the glob portion by taking everything before the first `*`, `?`, or `{`.
 */
function scopePathExists(pattern: string, projectRoot: string): boolean {
  // Strip glob characters - take the prefix path segment before any wildcard
  const prefix = pattern.replace(/[*?{[].*/g, '').replace(/\/+$/, '')
  if (prefix === '' || prefix === '.') {
    // Glob rooted at project root - project root always exists
    return existsSync(projectRoot)
  }
  const absPath = join(projectRoot, prefix)
  if (!existsSync(absPath)) return false
  const s = statSync(absPath)
  return s.isDirectory() || s.isFile()
}

export const rule: Rule<Config> = {
  id: 'violations-meta/no-dead-rule-scope',
  tags: 'violations-meta',
  defaultScope: ['.violations/rules/**/*.ts', '.violations/rules/**/*.js'],
  defaultSeverity: 'error',

  async check(_files: string[], config: Config): Promise<Violation[]> {
    const violations: Violation[] = []
    const projectRoot = config.projectRoot ?? process.cwd()

    for (const ruleFile of config.ruleFiles) {
      let source: string
      try {
        source = await readFile(ruleFile, 'utf8')
      } catch {
        continue
      }

      const scopeGlobs = extractDefaultScope(source)
      // No defaultScope array - dynamic or special rule, exempt
      if (scopeGlobs === null) continue

      // Check whether at least one glob prefix resolves to an existing path
      const anyExists = scopeGlobs.some(pattern => scopePathExists(pattern, projectRoot))

      if (!anyExists) {
        violations.push({
          file: ruleFile,
          line: 1,
          message: `Dead rule scope - defaultScope globs resolve to no existing paths: [${scopeGlobs.join(', ')}]`,
        })
      }
    }

    return violations
  },
}
