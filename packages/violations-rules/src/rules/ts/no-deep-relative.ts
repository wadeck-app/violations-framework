import { readFile } from 'node:fs/promises'
import type { Rule, Violation } from '../../types.js'

export type Config = Record<never, never>

const DEEP_RELATIVE_RE = /^\s*(?:import|export)\b.*from\s+['"](\.\.\/){2,}/

export const rule: Rule<Config> = {
  id: 'ts/no-deep-relative',
  tags: 'ts',
  defaultScope: ['**/*.ts', '**/*.tsx'],
  defaultSeverity: 'error',
  async check(files: string[], _config: Config): Promise<Violation[]> {
    const violations: Violation[] = []
    for (const file of files) {
      const text = await readFile(file, 'utf8').catch(() => '')
      const lines = text.split('\n')
      for (let i = 0; i < lines.length; i++) {
        if (DEEP_RELATIVE_RE.test(lines[i]!)) {
          violations.push({ file, line: i + 1, message: "Deep relative import (../../) — use a path alias (e.g. '@/') instead" })
        }
      }
    }
    return violations
  },
}
