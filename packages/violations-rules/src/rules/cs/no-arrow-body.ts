import { readFile } from 'node:fs/promises'
import type { Rule, Violation } from '../types.js'

export type Config = Record<never, never>

const METHOD_ARROW = /\)\s*=>\s*[^{>]/
const LAMBDA_ASSIGN = /=\s*\(|=>\s*$/

export const rule: Rule<Config> = {
  id: 'cs/no-arrow-body',
  tags: 'cs',
  defaultScope: ['**/*.cs'],
  defaultSeverity: 'info',
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
      if (!text.includes('=>')) continue
      const lines = text.split(/\r?\n/)
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i]
        const trimmed = line.trimStart()
        if (trimmed.startsWith('//') || trimmed.startsWith('*')) continue
        if (!METHOD_ARROW.test(line)) continue
        // Must look like a method declaration: starts with access modifier
        if (!/^\s*(public|private|protected|internal|override|virtual|static|async|abstract|sealed)\b/.test(line)) continue
        if (LAMBDA_ASSIGN.test(line)) continue
        violations.push({ file, line: i + 1, message: 'Arrow body method forbidden - use block body { return ...; }.' })
      }
    }
    return violations
  },
}
