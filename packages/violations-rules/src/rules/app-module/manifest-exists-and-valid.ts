import { existsSync } from 'node:fs'
import { dirname, join } from 'node:path'
import type { Rule, Violation } from '../types.js'
import { validateManifestViaAppCoreCli } from './manifest.js'

export type Config = Record<never, never>

// Every app-module package must ship a valid manifest.json - a package with
// backend code but no manifest cannot be registered with app-core at all.
//
// The violations rule API only hands check() a list of EXISTING files that
// matched defaultScope - there is no way to represent "a file is missing"
// from that list alone. So this rule scopes itself to package.json (always
// present for a real npm package) as an anchor, and checks for the sibling
// manifest.json from there, rather than scoping to manifest.json itself
// (which would never appear in `files` if it's the thing that's missing).
const FORBIDDEN_MESSAGE = 'app-module package is missing manifest.json - an app-module without a manifest cannot be registered with app-core at all.'

let warnedMissingBinary = false

export const rule: Rule<Config> = {
  id: 'app-module/manifest-exists-and-valid',
  tags: 'app-module',
  alwaysActive: true,
  defaultScope: ['**/packages/app-module-*/package.json'],
  defaultSeverity: 'error',

  async check(files: string[], _config: Config): Promise<Violation[]> {
    const violations: Violation[] = []

    for (const packageJsonPath of files) {
      const dir = dirname(packageJsonPath)
      const manifestPath = join(dir, 'manifest.json')

      if (!existsSync(manifestPath)) {
        violations.push({ file: manifestPath, line: 1, message: FORBIDDEN_MESSAGE })
        continue
      }

      const result = validateManifestViaAppCoreCli(manifestPath)

      if (result.kind === 'unavailable') {
        if (!warnedMissingBinary) {
          warnedMissingBinary = true
          process.stderr.write(
            '[warn] app-module/manifest-exists-and-valid: "app-core-cli" binary not found on PATH - skipping manifest schema validation for this run.\n' +
            '       Install app-core-cli (the global app-core tooling binary) to enable this check, or silence this warning by disabling the rule:\n' +
            '       rules: { \'app-module/manifest-exists-and-valid\': { $severity: false } }\n'
          )
        }
        continue
      }

      if (result.kind === 'invalid') {
        violations.push({ file: manifestPath, line: 1, message: `manifest.json failed validation: ${result.message}` })
      }
    }

    return violations
  },
}
