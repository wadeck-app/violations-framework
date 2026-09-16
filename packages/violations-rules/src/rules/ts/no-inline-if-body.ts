import { readFile } from 'node:fs/promises'
import type { Rule, Violation } from '../types.js'

export type Config = Record<never, never>

const IF_RE = /^\s*(?:(?:}\s*)?else\s+)?if\s*\(/

function findCondEnd(line: string): number {
  const start = line.indexOf('(', line.search(/if\s*\(/))
  if (start === -1) return -1
  let depth = 0
  for (let i = start; i < line.length; i++) {
    if (line[i] === '(') depth++
    else if (line[i] === ')') { depth--; if (depth === 0) return i }
  }
  return -1
}

export const rule: Rule<Config> = {
  id: 'ts/no-inline-if-body',
  tags: 'ts',
  defaultScope: ['**/*.ts', '**/*.tsx', '**/*.js'],
  defaultSeverity: 'error',

  async check(files: string[], _config: Config): Promise<Violation[]> {
    const violations: Violation[] = []
    for (const file of files) {
      const text = await readFile(file, 'utf8').catch(() => '')
      const lines = text.split(/\r?\n/)
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i]!
        const trimmed = line.trimStart()
        if (trimmed.startsWith('//') || trimmed.startsWith('*') || trimmed.startsWith('/*')) continue
        if (!IF_RE.test(line)) continue
        const condEnd = findCondEnd(line)
        if (condEnd === -1) continue
        const after = line.slice(condEnd + 1).trimStart()
        if (!after || after.startsWith('//')) {
          // body on next line -- check it opens with {
          const next = lines[i + 1]?.trimStart() ?? ''
          if (next && !next.startsWith('{')) {
            violations.push({ file, line: i + 1, message: 'if-body must use braces -- found body without { on next line.' })
          }
        } else if (!after.startsWith('{')) {
          violations.push({ file, line: i + 1, message: 'if-body must use braces and be on its own line -- found inline body without {.' })
        }
      }
    }
    return violations
  },
}
