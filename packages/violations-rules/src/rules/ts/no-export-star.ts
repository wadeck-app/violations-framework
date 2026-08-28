import { readFile } from 'node:fs/promises'
import type { Rule, Violation } from '../types.js'

export type Config = Record<never, never>

const EXPORT_STAR_RE = /^export \* from/

export const rule: Rule<Config> = {
  id: 'ts/no-export-star',
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
        if (!EXPORT_STAR_RE.test(lines[i].trimStart())) continue
        violations.push({
          file,
          line: i + 1,
          message: 'export * from - use explicit named exports instead',
        })
      }
    }
    return violations
  },
}
