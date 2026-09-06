import { readFile } from 'node:fs/promises'
import type { Rule, Violation } from '../types.js'

export type Config = Record<never, never>

// Matches try { ... } or catch (...) { ... } or finally { ... } all on one line.
const INLINE_TRY_RE = /^\s*(?:try|catch\s*(?:\([^)]*\))?|finally)\s*\{[^}]*\}/

export const rule: Rule<Config> = {
  id: 'cs/no-inline-try-body',
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
        if (INLINE_TRY_RE.test(lines[i])) {
          violations.push({ file, line: i + 1, message: 'try/catch/finally body must be on its own line -- inline blocks like `try { stmt; } catch { }` are not allowed.' })
        }
      }
    }
    return violations
  },
}
