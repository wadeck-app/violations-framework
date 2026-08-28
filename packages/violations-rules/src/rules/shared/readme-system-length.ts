import { readFile } from 'node:fs/promises'
import { basename } from 'node:path'
import type { Rule, Violation } from '../types.js'

export type Config = {
  maxLines?: number
}

const DEFAULT_MAX_LINES = 50

export const rule: Rule<Config> = {
  id: 'shared/readme-system-length',
  tags: 'shared',
  defaultScope: ['**/README.md'],
  defaultSeverity: 'error',

  async check(files: string[], config: Config): Promise<Violation[]> {
    const violations: Violation[] = []
    const maxLines = config.maxLines ?? DEFAULT_MAX_LINES

    for (const file of files) {
      // Accept any casing of README.md as the runner may pass files from glob patterns
      if (basename(file).toLowerCase() !== 'readme.md') continue

      let text: string
      try {
        text = await readFile(file, 'utf8')
      } catch {
        continue
      }

      const lineCount = text.split(/\r?\n/).length
      if (lineCount > maxLines) {
        violations.push({
          file,
          line: maxLines + 1,
          message:
            `README.md has ${lineCount} lines, exceeding the ${maxLines}-line limit. ` +
            `Move exhaustive/reference content to a satellite doc and link to it from the README.`,
        })
      }
    }

    return violations
  },
}
