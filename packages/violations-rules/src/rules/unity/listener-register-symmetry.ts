import { readFile } from 'node:fs/promises'
import type { Rule, Violation } from '../types.js'

export type Config = Record<never, never>

const RE_REGISTER   = /\b[a-z][a-zA-Z0-9_]*\.Register\b\(/g
const RE_UNREGISTER = /\.Unregister\b\(|UnregisterIfSet\(/g

export const rule: Rule<Config> = {
  id: 'unity/listener-register-symmetry',
  tags: 'unity',
  defaultScope: ['Assets/**/*.cs'],
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
      const registerCount   = (text.match(RE_REGISTER)   ?? []).length
      const unregisterCount = (text.match(RE_UNREGISTER) ?? []).length
      if (registerCount > 0 && unregisterCount === 0) {
        violations.push({ file, line: 1, message: `${registerCount} .Register( call(s) found but no .Unregister( or UnregisterIfSet( - listener may leak.` })
      }
    }
    return violations
  },
}
