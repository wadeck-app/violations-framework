import { readFile } from 'node:fs/promises'
import type { Rule, Violation } from '../types.js'

export type Config = Record<never, never>

const EXCLUDE_RE = /(^|\/)_generated\//

// Matches `RunSync += async` with arbitrary whitespace around `+=`
// Deliberately does NOT match `RunAsync += async`
const ASYNC_INTO_SYNC_RUNNER = /\bRunSync\b\s*\+=\s*async\b/
// Matches a line ending in `RunSync +=` with the lambda's `async` keyword wrapped onto the next line
const SYNC_RUNNER_ASSIGN_TRAILING = /\bRunSync\b\s*\+=\s*$/
const ASYNC_LEADING = /^\s*async\b/

export const rule: Rule<Config> = {
  id: 'unity/no-async-lambda-into-syncrunner',
  tags: 'unity',
  defaultScope: ['Assets/**/*.cs'],
  defaultSeverity: 'error',
  async check(files: string[], _config: Config): Promise<Violation[]> {
    const violations: Violation[] = []
    for (const file of files) {
      const rel = file.split('\\').join('/')
      if (EXCLUDE_RE.test(rel)) continue
      let text: string
      try {
        text = await readFile(file, 'utf8')
      } catch {
        continue
      }
      const lines = text.split(/\r?\n/)
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i]
        // Catches a wrapped lambda signature such as `RunSync +=\n    async () => ...`
        const wrapsToAsyncNextLine =
          SYNC_RUNNER_ASSIGN_TRAILING.test(line) && i + 1 < lines.length && ASYNC_LEADING.test(lines[i + 1])
        if (ASYNC_INTO_SYNC_RUNNER.test(line) || wrapsToAsyncNextLine) {
          violations.push({
            file,
            line: i + 1,
            message: 'RunSync += async ... compiles as a fire-and-forget Action; use RunAsync for closures that await.',
          })
        }
      }
    }
    return violations
  },
}
