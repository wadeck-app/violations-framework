import { readFile } from 'node:fs/promises'
import type { Rule, Violation } from '../types.js'

export type Config = Record<never, never>

// Matches a line that is just an if-condition with no opening brace and no body.
const IF_NO_BRACE_RE = /^\s*(?:}\s*else\s+)?if\s*\([^)]*\)\s*$/
// Matches a line that is just an opening brace (Allman style).
const ALLMAN_BRACE_RE = /^\s*\{\s*$/

export const rule: Rule<Config> = {
  id: 'cs/no-allman-if-brace',
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
      for (let i = 0; i < lines.length - 1; i++) {
        if (IF_NO_BRACE_RE.test(lines[i]) && ALLMAN_BRACE_RE.test(lines[i + 1])) {
          violations.push({ file, line: i + 1, message: 'Opening brace must be on the same line as the if -- use `if (x) {`, not Allman style `if (x)\n{`.' })
        }
      }
    }
    return violations
  },
}
