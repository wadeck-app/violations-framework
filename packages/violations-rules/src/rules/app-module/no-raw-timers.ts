import { readFileSync } from 'node:fs'
import type { Rule, Violation } from '../types.js'

export type Config = Record<never, never>

// app-module packages must use moduleContext.setInterval/setTimeout/on instead
// of raw globals, so app-core can clear them automatically on unload.
// Scoped to **/packages/app-module-*/api-backend/** so it auto-applies in any repo
// that adds one, with no per-repo config/opt-in. Only the backend runs in
// app-core's process; other folders (e.g. dsl-lib/, the built browser bundle)
// run in the browser where raw timers do not leak on unload.
//
// Only global, unqualified calls are flagged. A generic `.on(...)` check would
// also match `moduleContext.on(...)` itself - same syntactic shape, no type
// info available to a text-only rule - so raw EventEmitter.on is NOT checked
// here; addEventListener/setInterval/setTimeout are unambiguous because they
// are always global functions, never legitimately qualified by a receiver.
const FORBIDDEN_PATTERNS: Array<{ regex: RegExp; name: string }> = [
  { regex: /(?<![.\w])setInterval\s*\(/g, name: 'setInterval' },
  { regex: /(?<![.\w])setTimeout\s*\(/g, name: 'setTimeout' },
  { regex: /\.addEventListener\s*\(/g, name: 'addEventListener' },
]

export const rule: Rule<Config> = {
  id: 'app-module/no-raw-timers',
  tags: 'app-module',
  alwaysActive: true,
  defaultScope: ['**/packages/app-module-*/api-backend/**/*.ts', '**/packages/app-module-*/api-backend/**/*.js', '**/packages/app-module-*/api-backend/**/*.mjs'],
  defaultSeverity: 'error',

  async check(files: string[], _config: Config): Promise<Violation[]> {
    const violations: Violation[] = []

    for (const file of files) {
      if (file.endsWith('.test.ts') || file.endsWith('.test.js')) {
        continue;
      }
      const content = readFileSync(file, 'utf-8')
      const lines = content.split('\n')

      lines.forEach((lineText, idx) => {
        for (const { regex, name } of FORBIDDEN_PATTERNS) {
          if (regex.test(lineText)) {
            violations.push({
              file,
              line: idx + 1,
              message: `app-module code must use moduleContext.${name === 'addEventListener' ? 'on' : name}() instead of the raw global ${name} - app-core clears moduleContext registrations on unload, raw timers/listeners leak.`,
            })
          }
          regex.lastIndex = 0
        }
      })
    }

    return violations
  },
}
