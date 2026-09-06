import { readFile } from 'node:fs/promises'
import type { Rule, Violation } from '../types.js'

export type Config = Record<never, never>

// Matches: if (...) { singleStatement; }  all on one line (inline with braces).
const INLINE_IF_RE = /^\s*(?:}\s*else\s+)?if\s*\([^)]*\)\s*\{[^}]+\}\s*(?:\/\/.*)?$/

export const rule: Rule<Config> = {
  id: 'cs/no-inline-if-body',
  tags: 'cs',
  defaultScope: ['**/*.cs'],
  defaultSeverity: 'error',
  async check(files: string[], _config: Config): Promise<Violation[]> {
    const violations: Violation[] = []
    for (const file of files) {
      let text: string
      try {
        text = await readFile(file, 'utf8')
      } catch {
        continue
      }
      const lines = text.split(/\r?\n/)
      for (let i = 0; i < lines.length; i++) {
        if (INLINE_IF_RE.test(lines[i])) {
          violations.push({ file, line: i + 1, message: 'if-body must be on its own line -- use a multi-line block, not an inline if (...) { stmt; }.' })
        }
      }
    }
    return violations
  },
}
