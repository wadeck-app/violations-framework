import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import type { Rule, Violation } from '../types.js'
import { isDir, listFiles, moduleRootOfRootFile } from './layout.js'
import { readManifestShape } from './source-manifest.js'

export type Config = Record<never, never>

// Every app-module must ship a manifest.json that is a JSON object, and its dslLib must agree with
// src/dsl-components. The manifest schema itself is validated by app-core's rule (app-core-sdk/manifest-valid,
// shipped in @wadeck-app/app-core-sdk/violations).
//
// The rule API only hands check() existing files, so "a file is missing" cannot be represented from
// manifest.json itself. The rule scopes itself to package.json (present in every real package) as an
// anchor and looks for the sibling manifest.json from there.
export const rule: Rule<Config> = {
  id: 'app-module/manifest-exists-and-valid',
  tags: 'app-module',
  alwaysActive: true,
  defaultScope: ['**/app-module-*/package.json'],
  defaultSeverity: 'error',

  async check(files: string[], _config: Config): Promise<Violation[]> {
    const violations: Violation[] = []

    for (const packageJsonPath of files) {
      const root = moduleRootOfRootFile(packageJsonPath)
      if (root === undefined) {
        continue
      }
      const manifestPath = join(root, 'manifest.json')

      if (!existsSync(manifestPath)) {
        violations.push({ file: manifestPath, line: 1, message: 'app-module package is missing manifest.json - an app-module without a manifest cannot be registered with app-core at all.' })
        continue
      }

      let raw: unknown
      try {
        raw = JSON.parse(readFileSync(manifestPath, 'utf-8'))
      } catch (err) {
        violations.push({ file: manifestPath, line: 1, message: `manifest.json is not valid JSON: ${(err as Error).message}` })
        continue
      }

      // Schema errors (missing id, unknown keys, bad slots...) are reported by app-core's own rule,
      // app-core-sdk/manifest-valid, so that they always follow the schema the module is built against.
      const manifest = readManifestShape(raw)
      if (manifest === undefined) {
        violations.push({ file: manifestPath, line: 1, message: 'manifest.json must be a JSON object ({ "id": ..., "extensionPoints": [...] }).' })
        continue
      }

      const componentsDir = join(root, 'src', 'dsl-components')
      const entryExists = existsSync(join(componentsDir, 'index.ts'))
      const hasComponents = isDir(componentsDir) && listFiles(componentsDir).length > 0
      if (manifest.hasDslLib && !entryExists) {
        violations.push({ file: join(componentsDir, 'index.ts'), line: 1, message: 'manifest.json declares dslLib but src/dsl-components/index.ts is missing. Create it (default-exporting the ComponentRegistryEntry[]), or remove dslLib.' })
      }
      if (!manifest.hasDslLib && hasComponents) {
        violations.push({ file: manifestPath, line: 1, message: 'src/dsl-components has files but manifest.json has no dslLib, so they would not be packaged. Add `"dslLib": { "shared": { ... } }`, or delete src/dsl-components.' })
      }
    }

    return violations
  },
}
