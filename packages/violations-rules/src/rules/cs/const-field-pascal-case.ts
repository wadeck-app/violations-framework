import { readFile } from 'node:fs/promises'
import type { Rule, Violation } from '../../types.js'

export type Config = Record<never, never>

const CONST_FIELD = /^\s*(?:public|private|protected|internal|static|readonly|\s)*\bconst\s+[A-Za-z_][A-Za-z0-9_<>\[\],.\s]*?\s+([A-Za-z_][A-Za-z0-9_]*)\s*=/
const PASCAL_CASE = /^[A-Z][a-zA-Z0-9]*$/

export const rule: Rule<Config> = {
  id: 'cs/const-field-pascal-case',
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
      if (!text.includes('const ')) continue
      const lines = text.split(/\r?\n/)
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i]
        const trimmed = line.trimStart()
        if (trimmed.startsWith('//') || trimmed.startsWith('*')) continue
        const match = CONST_FIELD.exec(line)
        if (!match) continue
        const name = match[1]
        if (PASCAL_CASE.test(name)) continue
        violations.push({ file, line: i + 1, message: `Const field "${name}" must be named in PascalCase.` })
      }
    }
    return violations
  },
}
