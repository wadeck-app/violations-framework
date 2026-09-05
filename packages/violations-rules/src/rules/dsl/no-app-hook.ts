import { readFile } from 'node:fs/promises'
import type { Rule, Violation } from '../types.js'

export type Config = Record<never, never>

// Detects custom React hooks defined (exported) inside *-app packages.
// App packages must not own hook logic - move hooks to the -ui package or DSL layer.
const EXPORT_HOOK_RE = /\bexport\s+(?:function|const)\s+(use[A-Z]\w*)/

export const rule: Rule<Config> = {
  id: 'dsl/no-app-hook',
  tags: 'dsl',
  defaultScope: ['packages/*-app/src/**/*.ts', 'packages/*-app/src/**/*.tsx'],
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

      const lines = text.split('\n')
      for (let i = 0; i < lines.length; i++) {
        const m = EXPORT_HOOK_RE.exec(lines[i])
        if (!m) continue
        violations.push({
          file,
          line: i + 1,
          message: `Custom hook '${m[1]}' must not be defined in a *-app package - move it to the -ui package or DSL layer`,
        })
      }
    }

    return violations
  },
}
