import { readFile } from 'node:fs/promises'
import type { Rule, Violation } from '../../types.js'

export type Config = Record<never, never>

// Same-line style: `namespace Foo {` or `namespace Foo;` (file-scoped)
const NAMESPACE_SAME_LINE = /^\s*namespace\s+[A-Za-z_][A-Za-z0-9_.]*\s*[\{;]/
// Allman style header: `namespace Foo` alone on a line (optionally followed by a line comment)
const NAMESPACE_ALLMAN_HEADER = /^\s*namespace\s+[A-Za-z_][A-Za-z0-9_.]*\s*(\/\/.*)?$/

function isFollowedByOpenBrace(lines: string[], headerIndex: number): boolean {
  for (let j = headerIndex + 1; j < lines.length; j++) {
    const trimmed = lines[j].trim()
    if (trimmed === '' || trimmed.startsWith('//')) continue
    return trimmed.startsWith('{')
  }
  return false
}

export const rule: Rule<Config> = {
  id: 'cs/no-namespace',
  tags: 'cs',
  defaultScope: ['**/*.cs'],
  defaultSeverity: 'error',
  async check(files: string[], _config: Config): Promise<Violation[]> {
    const violations: Violation[] = []
    for (const file of files) {
      // Exclude _generated/ dirs
      if (file.includes('/_generated/') || file.includes('\\_generated\\')) continue
      let text: string
      try {
        text = await readFile(file, 'utf8')
      } catch {
        continue
      }
      const lines = text.split(/\r?\n/)
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i]
        const isViolation =
          NAMESPACE_SAME_LINE.test(line) ||
          (NAMESPACE_ALLMAN_HEADER.test(line) && isFollowedByOpenBrace(lines, i))
        if (isViolation) {
          violations.push({ file, line: i + 1, message: 'Custom namespace declaration is forbidden.' })
        }
      }
    }
    return violations
  },
}
