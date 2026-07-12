import { access } from 'node:fs/promises'
import { join } from 'node:path'
import type { Rule, Violation } from '../../types.js'

export type Config = {
  projectRoot: string
}

async function dirExists(path: string): Promise<boolean> {
  try {
    await access(path)
    return true
  } catch {
    return false
  }
}

export const rule: Rule<Config> = {
  id: 'violations-meta/no-legacy-violations-folder',
  tags: 'violations-meta',
  // Scope is a placeholder - this rule checks a directory existence, not file contents.
  // The runner passes projectRoot via config; files[] is unused.
  defaultScope: ['.'],
  defaultSeverity: 'warning',

  async check(_files: string[], config: Config): Promise<Violation[]> {
    const legacyDir = join(config.projectRoot, 'scripts', 'violations')
    const exists = await dirExists(legacyDir)

    if (exists) {
      return [
        {
          file: join(config.projectRoot, 'scripts', 'violations'),
          line: 1,
          message:
            'Migrate rule files to .violations/rules/ and delete scripts/violations/',
        },
      ]
    }

    return []
  },
}
