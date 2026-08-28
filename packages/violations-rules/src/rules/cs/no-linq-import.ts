import { readFile } from 'node:fs/promises'
import type { Rule, Violation } from '../types.js'

export type Config = Record<never, never>

const PATTERN = /^\s*using\s+System\.Linq\s*;/

export const rule: Rule<Config> = {
  id: 'cs/no-linq-import',
  tags: 'cs',
  defaultScope: ['**/*.cs'],
  defaultSeverity: 'error',
  async check(files: string[], _config: Config): Promise<Violation[]> {
    const violations: Violation[] = []
    for (const file of files) {
      // Exclude _generated/ dirs
      if (file.includes('/_generated/') || file.includes('\\_generated\\')) continue
      let text: string
      try {
        text = await readFile(file, 'utf8')
      } catch {
        continue
      }
      if (!text.includes('System.Linq')) continue
      const lines = text.split(/\r?\n/)
      for (let i = 0; i < lines.length; i++) {
        if (PATTERN.test(lines[i])) {
          violations.push({ file, line: i + 1, message: 'LINQ import forbidden - use manual loops or extension methods instead.' })
        }
      }
    }
    return violations
  },
}
