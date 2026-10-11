import { readFileSync } from 'node:fs'
import type { Rule, Violation } from '../types.js'

export type Config = Record<never, never>

// Module UI is DSL-only, no React escape hatch, anywhere under
// packages/app-module-*/. Any .tsx file is an immediate violation (JSX has
// no legitimate purpose in an app-module); a .ts/.js/.mjs file is flagged
// if it imports 'react' or 'react-dom' at all.
const REACT_IMPORT = /from\s+['"]react(-dom)?['"]|require\(\s*['"]react(-dom)?['"]\s*\)/

export const rule: Rule<Config> = {
  id: 'app-module/no-react',
  tags: 'app-module',
  alwaysActive: true,
  defaultScope: [
    '**/packages/app-module-*/**/*.ts',
    '**/packages/app-module-*/**/*.tsx',
    '**/packages/app-module-*/**/*.js',
    '**/packages/app-module-*/**/*.mjs',
  ],
  defaultSeverity: 'error',

  async check(files: string[], _config: Config): Promise<Violation[]> {
    const violations: Violation[] = []

    for (const file of files) {
      if (file.endsWith('.test.ts') || file.endsWith('.test.tsx')) {
        continue;
      }

      if (file.endsWith('.tsx')) {
        violations.push({ file, line: 1, message: 'app-module code must not contain .tsx files - UI is DSL-only, no React.' })
        continue
      }

      const content = readFileSync(file, 'utf-8')
      const lines = content.split('\n')
      lines.forEach((lineText, idx) => {
        if (REACT_IMPORT.test(lineText)) {
          violations.push({ file, line: idx + 1, message: 'app-module code must not import react/react-dom - UI is DSL-only, no React.' })
        }
      })
    }

    return violations
  },
}
