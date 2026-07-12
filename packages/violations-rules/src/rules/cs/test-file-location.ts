import { basename } from 'node:path'
import type { Rule, Violation } from '../../types.js'

export type Config = Record<never, never>

export const rule: Rule<Config> = {
  id: 'cs/test-file-location',
  tags: 'cs',
  defaultScope: ['**/*.cs'],
  defaultSeverity: 'error',
  async check(files: string[], _config: Config): Promise<Violation[]> {
    const violations: Violation[] = []
    for (const file of files) {
      const base = basename(file)
      if (!base.startsWith('Test_') || !base.endsWith('.cs')) continue
      const segments = file.split(/[/\\]/)
      if (segments.includes('_tests')) continue
      violations.push({ file, line: 1, message: `Test_*.cs file must live under a _tests/ folder (found at ${file}).` })
    }
    return violations
  },
}
