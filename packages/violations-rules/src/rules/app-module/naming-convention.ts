import { basename, dirname } from 'node:path'
import type { Rule, Violation } from '../types.js'
import { isExcludedPath } from './layout.js'

export type Config = Record<never, never>

// Any package directory shipping a manifest.json (the signal that it's an
// app-module) must itself be named `app-module-<name>`, e.g. `app-module-queue`.
// A bare `app-module` (no suffix) is also rejected, not just names missing the prefix.
// The generated dist-module/manifest.json, .app-core-dev and node_modules are not module folders
// and are skipped. The scope cannot be `**/app-module-*/**`: this rule exists to find folders that
// do NOT carry that name.
const NAME_PATTERN = /^app-module-.+$/

export const rule: Rule<Config> = {
  id: 'app-module/naming-convention',
  tags: 'app-module',
  alwaysActive: true,
  defaultScope: ['**/packages/**/manifest.json'],
  defaultSeverity: 'error',

  async check(files: string[], _config: Config): Promise<Violation[]> {
    const violations: Violation[] = []

    for (const manifestPath of files) {
      if (isExcludedPath(manifestPath)) {
        continue
      }
      const dirName = basename(dirname(manifestPath))
      if (!NAME_PATTERN.test(dirName)) {
        violations.push({
          file: manifestPath,
          line: 1,
          message: `app-module package directory "${dirName}" must be named "app-module-<name>" - a bare "app-module" or any other name is not accepted.`,
        })
      }
    }

    return violations
  },
}
