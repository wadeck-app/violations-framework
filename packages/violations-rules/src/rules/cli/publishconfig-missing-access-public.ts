import { readFile } from 'node:fs/promises'
import type { Rule, Violation } from '../types.js'

export type Config = Record<never, never>

interface PackageJson {
  name?: string
  publishConfig?: { access?: string; [key: string]: unknown }
}

// Detects package.json files for scoped packages (@scope/name) that have a
// publishConfig but are missing "access": "public".
// Without it, npm defaults to private, making the package inaccessible without auth.
export const rule: Rule<Config> = {
  id: 'cli/publishconfig-missing-access-public',
  tags: 'cli',
  defaultScope: ['**/package.json'],
  defaultSeverity: 'error',

  async check(files: string[], _config: Config): Promise<Violation[]> {
    const violations: Violation[] = []

    for (const file of files) {
      let text: string
      try {
        text = await readFile(file, 'utf8')
      } catch {
        continue
      }

      let pkg: PackageJson
      try {
        pkg = JSON.parse(text) as PackageJson
      } catch {
        continue
      }

      const { name, publishConfig } = pkg
      if (typeof name !== 'string' || !name.startsWith('@')) continue
      if (!publishConfig) continue
      if (publishConfig['access'] === 'public') continue

      violations.push({
        file,
        line: 1,
        message: `Scoped package "${name}" has publishConfig but is missing "access": "public" - npm defaults to private, making the package inaccessible without auth token`,
      })
    }

    return violations
  },
}
