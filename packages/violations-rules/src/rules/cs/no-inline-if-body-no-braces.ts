import { readFile } from 'node:fs/promises'
import type { Rule, Violation } from '../types.js'

export type Config = Record<never, never>

// Matches: if (...) stmt;  all on one line -- body has no opening brace.
const INLINE_NO_BRACE_RE = /^\s*(?:}\s*else\s+)?if\s*\([^)]*\)\s*(?!\s*\{)[^;{\/]+;/

export const rule: Rule<Config> = {
  id: 'cs/no-inline-if-body-no-braces',
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
        if (INLINE_NO_BRACE_RE.test(lines[i])) {
          violations.push({ file, line: i + 1, message: 'if-body must use braces and be on its own line -- `if (x) stmt;` is not allowed.' })
        }
      }
    }
    return violations
  },
}
