import { readFile, lstat, readdir } from 'node:fs/promises'
import { join, dirname } from 'node:path'
import type { Rule, Violation } from '../../types.js'

export type Config = Record<never, never>

interface PackageJson {
  name?: string
  workspaces?: string[] | { packages?: string[] }
}

async function resolveWorkspacePackages(
  rootDir: string,
  workspacesGlobs: string[],
): Promise<Map<string, string>> {
  const nameToDir = new Map<string, string>()
  for (const glob of workspacesGlobs) {
    const suffix = glob.replace(/\/\*$/, '')
    const parentDir = join(rootDir, suffix)
    let entries: string[]
    try {
      entries = await readdir(parentDir)
    } catch {
      continue
    }
    for (const entry of entries) {
      const pkgDir = join(parentDir, entry)
      const pkgJsonPath = join(pkgDir, 'package.json')
      try {
        const raw = await readFile(pkgJsonPath, 'utf8')
        const pkg = JSON.parse(raw) as PackageJson
        if (pkg.name) nameToDir.set(pkg.name, pkgDir)
      } catch {
        // not a package dir
      }
    }
  }
  return nameToDir
}

export const rule: Rule<Config> = {
  id: 'shared/no-workspace-shadow',
  tags: 'shared',
  defaultScope: ['**/package.json'],
  defaultSeverity: 'error',

  async check(files: string[], _config: Config): Promise<Violation[]> {
    const violations: Violation[] = []

    for (const file of files) {
      let raw: string
      try {
        raw = await readFile(file, 'utf8')
      } catch {
        continue
      }

      let pkg: PackageJson
      try {
        pkg = JSON.parse(raw) as PackageJson
      } catch {
        continue
      }

      if (!pkg.workspaces) continue

      const rootDir = dirname(file)
      const workspacesGlobs = Array.isArray(pkg.workspaces)
        ? pkg.workspaces
        : (pkg.workspaces.packages ?? [])

      const workspacePackages = await resolveWorkspacePackages(rootDir, workspacesGlobs)

      for (const [pkgName, pkgDir] of workspacePackages) {
        for (const [, otherDir] of workspacePackages) {
          if (otherDir === pkgDir) continue
          const shadowPath = join(otherDir, 'node_modules', pkgName)
          let stat
          try {
            stat = await lstat(shadowPath)
          } catch {
            continue
          }
          if (stat.isSymbolicLink()) continue
          violations.push({
            file,
            line: 1,
            message:
              `Workspace package '${pkgName}' is shadowed by a public npm package in ` +
              `${shadowPath}. Delete the local copy — it overrides workspace resolution.\n` +
              `  Fix: rm -rf "${shadowPath}"`,
          })
        }
      }
    }

    return violations
  },
}
