import { readFile } from 'node:fs/promises'
import type { Rule, Violation } from '../../types.js'

export type Config = {
  bannedTypes?: string[]
}

const DEFAULT_BANNED = [
  'InvalidOperationException',
  'ArgumentException',
  'NotSupportedException',
]

export const rule: Rule<Config> = {
  id: 'cs/no-raw-exception',
  tags: 'cs',
  defaultScope: ['**/*.cs'],
  defaultSeverity: 'error',
  async check(files: string[], config: Config): Promise<Violation[]> {
    const banned = config.bannedTypes ?? DEFAULT_BANNED
    const pattern = new RegExp(`\\bthrow\\s+new\\s+(${banned.join('|')})\\s*[(<]`)
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
      if (!text.includes('throw new ')) continue
      const lines = text.split(/\r?\n/)
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i]
        const trimmed = line.trimStart()
        if (trimmed.startsWith('//') || trimmed.startsWith('*')) continue
        if (pattern.test(line)) {
          violations.push({ file, line: i + 1, message: 'Use a domain exception instead of raw .NET exceptions for programming errors.' })
        }
      }
    }
    return violations
  },
}
