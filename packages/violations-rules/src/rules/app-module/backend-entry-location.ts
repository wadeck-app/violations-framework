import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import type { Rule, Violation } from '../types.js'
import { BACKEND_ENTRY, hasDefaultExport, moduleRootOfRootFile } from './layout.js'

export type Config = Record<never, never>

// The backend entry is fixed by convention (decision 81): src/backend/index.ts, with a default export.
// The source manifest no longer names it; `package` writes backendEntryPath into dist-module.
// Anchored on manifest.json: the rule API only hands check() existing files, so a missing entry
// cannot be a scoped file itself.
export const rule: Rule<Config> = {
  id: 'app-module/backend-entry-location',
  tags: 'app-module',
  alwaysActive: true,
  defaultScope: ['**/app-module-*/manifest.json'],
  defaultSeverity: 'error',

  async check(files: string[], _config: Config): Promise<Violation[]> {
    const violations: Violation[] = []

    for (const manifestPath of files) {
      const root = moduleRootOfRootFile(manifestPath)
      if (root === undefined) {
        continue
      }

      const entry = join(root, BACKEND_ENTRY)
      if (!existsSync(entry)) {
        violations.push({ file: entry, line: 1, message: `the backend entry is missing: it is always ${BACKEND_ENTRY}. Create it with \`export default function (ctx) { ... }\`.` })
      } else if (!hasDefaultExport(readFileSync(entry, 'utf-8'))) {
        violations.push({ file: entry, line: 1, message: 'the backend entry has no default export. Add `export default function (ctx) { ... }`: app-core calls it when the module loads.' })
      }
    }

    return violations
  },
}
