import { readFile } from 'node:fs/promises'
import type { Rule, Violation } from '../../types.js'

export type Config = Record<never, never>

const CROSS_PACKAGE_RE = /from\s+['"]\.\.(?:\/\.\.)+\/(?:dsl-renderer|dsl-ui[^'"]*)\//

export const rule: Rule<Config> = {
  id: 'ts/no-cross-package-relative',
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
        if (!CROSS_PACKAGE_RE.test(lines[i])) continue
        violations.push({
          file,
          line: i + 1,
          message:
            'Cross-package relative import - use the package alias instead (dsl-renderer, dsl-ui, dsl-ui-agent-fleet, etc.)',
        })
      }
    }
    return violations
  },
}
