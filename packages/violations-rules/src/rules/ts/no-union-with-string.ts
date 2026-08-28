import { readFile } from 'node:fs/promises'
import type { Rule, Violation } from '../types.js'

export type Config = Record<never, never>

// Matches a literal/identifier followed by `| string` but NOT `| string[]`
const UNION_STRING_RE = /(?:'[^']*'|"[^"]*"|\b[A-Za-z_][A-Za-z0-9_]*)\s*\|\s*string\b(?!\s*\[)/

export const rule: Rule<Config> = {
  id: 'ts/no-union-with-string',
  tags: 'ts',
  defaultScope: ['**/*.ts', '**/*.tsx'],
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
      const lines = text.split('\n')
      for (let i = 0; i < lines.length; i++) {
        if (!UNION_STRING_RE.test(lines[i])) continue
        violations.push({
          file,
          line: i + 1,
          message:
            'Union type ends with `| string` - use a closed set of literals; handle unknown values via a fallback at the call site',
        })
      }
    }
    return violations
  },
}
