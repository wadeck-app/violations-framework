import { readFileSync } from 'node:fs'
import { dirname, resolve, sep } from 'node:path'
import type { Rule, Violation } from '../types.js'
import { parseManifest } from './manifest.js'

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
      const dir = dirname(manifestPath)
      let manifest
      try {
        manifest = parseManifest(JSON.parse(readFileSync(manifestPath, 'utf-8')))
      } catch {
        continue // invalid manifest is reported by app-module/manifest-exists-and-valid
      }

      const requiredDir = resolve(dir, 'dsl-frontend') + sep
      for (const ep of manifest.extensionPoints) {
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
