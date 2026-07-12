import { readFile } from 'node:fs/promises'
import type { Rule, Violation } from '../../types.js'

export type Config = {
  restrictToPackages?: string[]
}

export const rule: Rule<Config> = {
  id: 'react/no-context-in-renderer',
  tags: 'react',
  defaultScope: ['**/*.ts', '**/*.tsx'],
  defaultSeverity: 'error',

  async check(files: string[], config: Config): Promise<Violation[]> {
    const violations: Violation[] = []
    const { restrictToPackages } = config

    for (const file of files) {
      // If restrictToPackages is set, only check files whose path is under one of those prefixes
      if (restrictToPackages && restrictToPackages.length > 0) {
        const fwd = file.replace(/\\/g, '/')
        const underRestricted = restrictToPackages.some(p => fwd.includes(p.replace(/\\/g, '/')))
        if (!underRestricted) continue
      }

      let text: string
      try {
        text = await readFile(file, 'utf8')
      } catch {
        continue
      }

      const lines = text.split('\n')
      for (let i = 0; i < lines.length; i++) {
        const trimmed = lines[i].trimStart()
        // Skip comment lines
        if (trimmed.startsWith('//') || trimmed.startsWith('*')) continue
        // Strip inline comments before checking
        const codeOnly = lines[i].replace(/\/\/.*$/, '')
        if (codeOnly.includes('createContext(')) {
          violations.push({
            file,
            line: i + 1,
            message:
              'createContext() in renderer file - renderer files must be pure; move context to a consumer package',
          })
        }
      }
    }

    return violations
  },
}
