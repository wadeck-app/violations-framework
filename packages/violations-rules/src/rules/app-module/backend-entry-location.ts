import { dirname, resolve, sep } from 'node:path'
import type { Rule, Violation } from '../types.js'
import { validateManifestViaAppCoreCli } from './manifest.js'

export type Config = Record<never, never>

// An app-module's backendEntryPath must live inside its own
// api-backend/ folder - keeps the backend/view split enforced, not just documented.
export const rule: Rule<Config> = {
  id: 'app-module/backend-entry-location',
  tags: 'app-module',
  alwaysActive: true,
  defaultScope: ['**/packages/app-module-*/manifest.json'],
  defaultSeverity: 'error',

  async check(files: string[], _config: Config): Promise<Violation[]> {
    const violations: Violation[] = []

    for (const manifestPath of files) {
      const result = validateManifestViaAppCoreCli(manifestPath)
      // "unavailable" (binary not installed) and "invalid" (bad manifest) are
      // both reported by app-module/manifest-exists-and-valid - this rule only
      // has anything to check once a valid, parsed manifest is in hand.
      if (result.kind !== 'ok') {
        continue;
      }

      const dir = dirname(manifestPath)
      const requiredDir = resolve(dir, 'api-backend') + sep
      const resolvedEntry = resolve(dir, result.manifest.backendEntryPath)
      if (!resolvedEntry.startsWith(requiredDir)) {
        violations.push({
          file: manifestPath,
          line: 1,
          message: `backendEntryPath "${result.manifest.backendEntryPath}" must resolve inside this module's api-backend/ folder, resolved to "${resolvedEntry}".`,
        })
      }
    }

    return violations
  },
}
