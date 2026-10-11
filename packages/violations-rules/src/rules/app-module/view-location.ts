import { dirname, resolve, sep } from 'node:path'
import type { Rule, Violation } from '../types.js'
import { validateManifestViaAppCoreCli } from './manifest.js'

export type Config = Record<never, never>

// Every path-type view in an app-module's manifest must live
// inside its own dsl-frontend/ folder - DSL data only, never code.
export const rule: Rule<Config> = {
  id: 'app-module/view-location',
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
      const requiredDir = resolve(dir, 'dsl-frontend') + sep
      for (const ep of result.manifest.extensionPoints) {
        if (ep.view.type !== 'path') {
          continue;
        }
        const resolvedView = resolve(dir, String(ep.view.value))
        if (!resolvedView.startsWith(requiredDir)) {
          violations.push({
            file: manifestPath,
            line: 1,
            message: `extensionPoint "${ep.slot}" view path "${ep.view.value}" must resolve inside this module's dsl-frontend/ folder, resolved to "${resolvedView}".`,
          })
        }
      }
    }

    return violations
  },
}
