import type { Rule, Violation } from '../types.js'
import { basename } from 'node:path'

export type Config = Record<never, never>

export const rule: Rule<Config> = {
  id: 'ts/no-barrel-index',
  tags: 'ts',
  defaultScope: ['**/*.ts', '**/*.tsx'],
  defaultSeverity: 'warning',

  async check(files: string[], _config: Config): Promise<Violation[]> {
    const violations: Violation[] = []
    for (const file of files) {
      const name = basename(file)
      if (name !== 'index.ts' && name !== 'index.tsx') continue
      violations.push({
        file,
        line: 1,
        message: 'Barrel index file - delete it and migrate all imports to direct paths',
      })
    }
    return violations
  },
}
