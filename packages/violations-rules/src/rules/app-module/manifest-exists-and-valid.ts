import { accessSync, constants, existsSync } from 'node:fs'
import { dirname, join, delimiter } from 'node:path'
import { spawnSync } from 'node:child_process'
import type { Rule, Violation } from '../types.js'

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

// Delegates to `app-core-cli validate <path>` (@wadeck-app/app-core-cli) instead
// of duplicating app-core's zod schema here - that CLI runs the exact same
// schema app-core's server uses, so there is one source of truth instead of a
// copy that can silently drift as the real manifest schema evolves.
export type ValidateResult =
  | { kind: 'ok' }
  | { kind: 'invalid'; message: string }
  | { kind: 'unavailable' }

// Resolves the binary ourselves via PATH/PATHEXT instead of letting spawnSync's
// shell resolve it - a shell-resolution "not found" is reported as a normal
// nonzero exit with a locale-dependent "command not found" message on stderr
// (verified on this machine), indistinguishable from a real validation
// failure without parsing OS/locale-specific text.
function resolveExecutable(name: string): string | null {
  const pathDirs = (process.env.PATH ?? '').split(delimiter).filter(Boolean)
  const extensions = process.platform === 'win32'
    ? (process.env.PATHEXT ?? '.COM;.EXE;.BAT;.CMD').split(';').filter(Boolean)
    : ['']

  for (const dir of pathDirs) {
    for (const ext of extensions) {
      const candidate = join(dir, name + ext)
      if (!existsSync(candidate)) {
        continue;
      }
      try {
        accessSync(candidate, constants.X_OK)
        return candidate
      } catch {
        continue
      }
    }
  }
  return null
}

export function validateManifestViaAppCoreCli(manifestPath: string): ValidateResult {
  const binaryPath = resolveExecutable('app-core-cli')
  if (!binaryPath) {
    return { kind: 'unavailable' }
  }

  // shell: true is required on Windows to launch a resolved .cmd/.bat shim
  // directly (verified: Node's spawnSync throws EINVAL on a .cmd path otherwise).
  // Safe here despite shell interpretation risks (DEP0190) because both the
  // binary path and manifestPath come from resolveExecutable()/defaultScope,
  // never from unsanitized user input.
  const result = spawnSync(binaryPath, ['validate', manifestPath], {
    encoding: 'utf-8',
    shell: process.platform === 'win32',
  })

  if (result.status === 0) {
    return { kind: 'ok' }
  }
  const message = (result.stderr || result.stdout || 'app-core-cli validate failed with no output').trim()
  return { kind: 'invalid', message }
}

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
