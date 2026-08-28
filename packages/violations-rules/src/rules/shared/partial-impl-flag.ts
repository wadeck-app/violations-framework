import { readFile } from 'node:fs/promises'
import type { Rule, Violation } from '../types.js'

export type Config = Record<never, never>

// violations-suppress: shared/partial-impl-flag intentional - this IS the rule definition
const MARKER = 'PARTIAL IMPLEMENTATION'

// Lines 0-4 (1-5) are the grace zone - marker there is intentional header usage.
const GRACE_LINES = 5

export const rule: Rule<Config> = {
  id: 'shared/partial-impl-flag',
  tags: 'shared',
  defaultScope: ['**/*.ts', '**/*.tsx'],
  defaultSeverity: 'info',

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
      // Only check lines after the grace zone (index >= GRACE_LINES, i.e. line >= 6)
      for (let idx = GRACE_LINES; idx < lines.length; idx++) {
        if (lines[idx].includes(MARKER)) {
          violations.push({
            file,
            line: idx + 1,
            message: 'PARTIAL IMPLEMENTATION marker found after line 5 - complete or move to header',
          })
          // Only report the first occurrence per file
          break
        }
      }
    }

    return violations
  },
}
