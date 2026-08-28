import { readFile } from 'node:fs/promises'
import type { Rule, Violation } from '../types.js'

export type Config = Record<never, never>

const COMPONENT_FN_RE = /^(?:export\s+)?function\s+[A-Z][a-zA-Z0-9]+\s*\(/gm

const SKIP_SUFFIXES = ['.dialogs.tsx', '.skeleton.tsx', '.test.tsx', '.stories.tsx']

export const rule: Rule<Config> = {
  id: 'ts/no-inline-subcomponent',
  tags: 'ts',
  defaultScope: ['**/*.tsx'],
  defaultSeverity: 'error',

  async check(files: string[], _config: Config): Promise<Violation[]> {
    const violations: Violation[] = []
    for (const file of files) {
      if (SKIP_SUFFIXES.some((suffix) => file.endsWith(suffix))) continue

      let text: string
      try {
        text = await readFile(file, 'utf8')
      } catch {
        continue
      }

      const matches = text.match(COMPONENT_FN_RE)
      if (!matches || matches.length < 2) continue

      violations.push({
        file,
        line: 1,
        message:
          'File defines multiple function components - extract sub-components to their own files',
      })
    }
    return violations
  },
}
