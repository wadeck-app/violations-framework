import { readFile } from 'node:fs/promises'
import type { Rule, Violation } from '../../types.js'

export type Config = {
  activeRuleIds: string[]
}

// Matches violations-suppress lines in source files (single-line suppress only)
// Handles //, /*, #, and <!-- prefix styles
const SUPPRESS_RE = /(?:\/\/|\/\*|#|<!--)\s*violations-suppress:\s*([a-z0-9/,\-]+)/i

export const rule: Rule<Config> = {
  id: 'shared/no-dead-suppress',
  tags: 'shared',
  defaultScope: ['**/*.ts', '**/*.tsx', '**/*.js'],
  defaultSeverity: 'error',

  async check(files: string[], config: Config): Promise<Violation[]> {
    const violations: Violation[] = []
    const activeIds = new Set(config.activeRuleIds)

    for (const file of files) {
      let lines: string[]
      try {
        const text = await readFile(file, 'utf8')
        lines = text.split(/\r?\n/)
      } catch {
        continue
      }

      for (let i = 0; i < lines.length; i++) {
        const m = SUPPRESS_RE.exec(lines[i])
        if (!m) continue

        const suppressedIds = m[1]
          .split(',')
          .map(s => s.trim().toLowerCase())
          .filter(Boolean)

        for (const id of suppressedIds) {
          if (!activeIds.has(id)) {
            violations.push({
              file,
              line: i + 1,
              message: `Dead suppress: rule '${id}' does not exist`,
            })
          }
        }
      }
    }

    return violations
  },
}
