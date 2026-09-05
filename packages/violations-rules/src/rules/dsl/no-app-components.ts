import { basename } from 'node:path'
import type { Rule, Violation } from '../types.js'

export type Config = Record<never, never>

// Files under packages/*-app/src/components/ are violations by presence.
// React components belong in the corresponding *-ui package, not in *-app.
export const rule: Rule<Config> = {
  id: 'dsl/no-app-components',
  tags: 'dsl',
  defaultScope: [
    'packages/*-app/src/components/**/*.ts',
    'packages/*-app/src/components/**/*.tsx',
  ],
  defaultSeverity: 'error',

  async check(files: string[], _config: Config): Promise<Violation[]> {
    return files.map(file => ({
      file,
      line: 1,
      message: `Component '${basename(file)}' must not be in a *-app package - move it to the corresponding *-ui package`,
    }))
  },
}
