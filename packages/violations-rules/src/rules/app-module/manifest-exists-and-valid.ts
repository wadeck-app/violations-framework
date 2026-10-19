import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import type { Rule, Violation } from '../types.js'
import { isDir, listFiles, moduleRootOfRootFile } from './layout.js'
import { validateSourceManifest } from './source-manifest.js'

export type Config = Record<never, never>

// Every app-module must ship a valid source manifest.json (id, extensionPoints, plus the optional
// dslLib.shared, requires, expose, lifecycle, showInNav; `package` writes version, backendEntryPath and
// dslLib.entry/css into dist-module/manifest.json), and dslLib must agree with src/dsl-components.
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

      const result = validateSourceManifest(raw)
      if (!result.ok) {
        violations.push({
          file: manifestPath,
          line: 1,
          message: `manifest.json failed validation: ${result.issues.join('; ')}. The source manifest holds only id, extensionPoints, dslLib.shared, requires, expose, lifecycle and showInNav; \`package\` writes the rest (version, backendEntryPath, dslLib.entry/css).`,
        })
        continue
      }
      const manifest = result.manifest

      const componentsDir = join(root, 'src', 'dsl-components')
      const entryExists = existsSync(join(componentsDir, 'index.ts'))
      const hasComponents = isDir(componentsDir) && listFiles(componentsDir).length > 0
      if (manifest.dslLib !== undefined && !entryExists) {
        violations.push({ file: join(componentsDir, 'index.ts'), line: 1, message: 'manifest.json declares dslLib but src/dsl-components/index.ts is missing. Create it (default-exporting the ComponentRegistryEntry[]), or remove dslLib.' })
      }
      if (manifest.dslLib === undefined && hasComponents) {
        violations.push({ file: manifestPath, line: 1, message: 'src/dsl-components has files but manifest.json has no dslLib, so they would not be packaged. Add `"dslLib": { "shared": { ... } }`, or delete src/dsl-components.' })
      }
    }

    return violations
  },
}
