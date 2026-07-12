import { readFile } from 'node:fs/promises'
import type { Rule, Violation } from '../../types.js'

export type Config = Record<never, never>

// violations-suppress: shared/no-em-dash intentional test fixture
// U+2014 em-dash and U+2013 en-dash — both forbidden
// violations-suppress: shared/no-em-dash intentional test fixture
const DASH_RE = /[—–]/

export const rule: Rule<Config> = {
  id: 'shared/no-em-dash',
  tags: 'shared',
  defaultScope: ['**/*.ts', '**/*.tsx', '**/*.cs', '**/*.md', '**/*.yaml', '**/*.shader', '**/*.js'],
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
        if (!DASH_RE.test(lines[i])) continue
        violations.push({
          file,
          line: i + 1,
          // violations-suppress: shared/no-em-dash intentional test fixture
          message: 'Em-dash or en-dash found — replace with a plain hyphen',
        })
      }
    }

    return violations
  },
}
