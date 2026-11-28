import type { Rule, Violation } from '../types.js'
import { basename } from 'node:path'

export type Config = Record<never, never>

// Fixed entry points of an app-module (decision 81): the module build looks them up by path, so they
// are not barrels. Exempted here, in the shared default, so no repo has to repeat an $exclude.
const APP_MODULE_ENTRY = /(?:^|\/)app-module-[^/]+\/src\/(?:backend|dsl-components|dsl-scenarios)\/index\.ts$/

export const rule: Rule<Config> = {
  id: 'ts/no-barrel-index',
  tags: 'ts',
  defaultScope: ['**/*.ts', '**/*.tsx'],
  defaultSeverity: 'warning',

  async check(files: string[], _config: Config): Promise<Violation[]> {
    const violations: Violation[] = []
    for (const file of files) {
      const name = basename(file)
      if (name !== 'index.ts' && name !== 'index.tsx') {
        continue;
      }
      if (APP_MODULE_ENTRY.test(file.replaceAll('\\', '/'))) {
        continue
      }
      violations.push({
        file,
        line: 1,
        message: 'Barrel index file - delete it and migrate all imports to direct paths',
      })
    }
    return violations
  },
}
