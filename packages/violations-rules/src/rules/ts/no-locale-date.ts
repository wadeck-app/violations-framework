import { readFile } from 'node:fs/promises'
import type { Rule, Violation } from '../types.js'

export type Config = Record<never, never>

const LOCALE_DATE_RE = /\.toLocaleString\(|\.toLocaleDateString\(|\.toLocaleTimeString\(/

export const rule: Rule<Config> = {
  id: 'ts/no-locale-date',
  tags: 'ts',
  defaultScope: ['**/*.ts', '**/*.tsx'],
  defaultSeverity: 'warning',

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
        if (!LOCALE_DATE_RE.test(lines[i])) continue
        violations.push({
          file,
          line: i + 1,
          message: 'Use formatRelativeTime() or a shared formatter instead of locale date methods',
        })
      }
    }
    return violations
  },
}
