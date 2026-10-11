import { accessSync, constants, existsSync } from 'node:fs'
import { delimiter, join } from 'node:path'
import { spawnSync } from 'node:child_process'

export type ExtensionPointView =
  | { type: 'path'; value: string }
  | { type: 'inline'; value: unknown }

export type ExtensionPoint = {
  kind: string
  slot: string
  view: ExtensionPointView
}

export type Manifest = {
  version: string
  backendEntryPath: string
  extensionPoints: ExtensionPoint[]
}

// Delegates to `app-core-cli validate <path> --json` (@wadeck-app/app-core-cli)
// instead of duplicating app-core's zod schema here - that CLI runs the exact
// same schema app-core's server uses, so there is one source of truth instead
// of a copy that can silently drift as the real manifest schema evolves.
// Shared by all three app-module rules that need manifest content/validity
// (manifest-exists-and-valid, backend-entry-location, view-location).
export type ManifestCliResult =
  | { kind: 'ok'; manifest: Manifest }
  | { kind: 'invalid'; message: string }
  | { kind: 'unavailable' }

// Resolves the binary ourselves via PATH/PATHEXT instead of letting spawnSync's
// shell resolve it - a shell-resolution "not found" is reported as a normal
// nonzero exit with a locale-dependent "command not found" message on stdout
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

export function validateManifestViaAppCoreCli(manifestPath: string): ManifestCliResult {
  const binaryPath = resolveExecutable('app-core-cli')
  if (!binaryPath) {
    return { kind: 'unavailable' }
  }

  // shell: true is required on Windows to launch a resolved .cmd/.bat shim
  // directly (verified: Node's spawnSync throws EINVAL on a .cmd path otherwise).
  // Safe here despite shell interpretation risks (DEP0190) because both the
  // binary path and manifestPath come from resolveExecutable()/defaultScope,
  // never from unsanitized user input.
  const result = spawnSync(binaryPath, ['validate', manifestPath, '--json'], {
    encoding: 'utf-8',
    shell: process.platform === 'win32',
  })

  const stdout = (result.stdout ?? '').trim()

  if (result.status === 0) {
    try {
      return { kind: 'ok', manifest: JSON.parse(stdout) as Manifest }
    } catch {
      return { kind: 'invalid', message: `app-core-cli validate --json returned non-JSON stdout on success: ${stdout}` }
    }
  }

  try {
    const parsed = JSON.parse(stdout) as { error: string }
    return { kind: 'invalid', message: parsed.error }
  } catch {
    const message = (result.stderr || stdout || 'app-core-cli validate failed with no output').trim()
    return { kind: 'invalid', message }
  }
}
