import { readFileSync } from 'node:fs'
import { dirname, resolve, sep } from 'node:path'
import type { Rule, Violation } from '../types.js'
import { parseManifest } from './manifest.js'

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
      const dir = dirname(manifestPath)
      let manifest
      try {
        manifest = parseManifest(JSON.parse(readFileSync(manifestPath, 'utf-8')))
      } catch {
        continue // invalid manifest is reported by app-module/manifest-exists-and-valid
      }

      const requiredDir = resolve(dir, 'api-backend') + sep
      const resolvedEntry = resolve(dir, manifest.backendEntryPath)
      if (!resolvedEntry.startsWith(requiredDir)) {
        violations.push({
          file: manifestPath,
          line: 1,
          message: `backendEntryPath "${manifest.backendEntryPath}" must resolve inside this module's api-backend/ folder, resolved to "${resolvedEntry}".`,
        })
      }
    }

    return violations
  },
}
