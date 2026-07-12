import { readFile } from 'node:fs/promises'
import type { Rule, Violation } from '../../types.js'

export type Config = Record<never, never>

const CLASS_DECL = /^\s*(public|internal|private|protected|abstract|sealed|static|partial|\s)*\s*(class|interface|struct|enum|record)\s+\w/

function isSingleLineComment(line: string): boolean {
  return /^\s*\/\/(?!\/)/.test(line)
}

export const rule: Rule<Config> = {
  id: 'cs/no-multiline-comment-before-class',
  tags: 'cs',
  defaultScope: ['**/*.cs'],
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
      const lines = text.split(/\r?\n/)
      for (let i = 1; i < lines.length; i++) {
        if (!CLASS_DECL.test(lines[i])) continue
        // Walk backwards over blank lines
        let prev = i - 1
        while (prev >= 0 && lines[prev].trim() === '') prev--
        if (prev < 0) continue
        if (!isSingleLineComment(lines[prev])) continue
        // Find block start
        let blockStart = prev
        while (blockStart > 0 && isSingleLineComment(lines[blockStart - 1])) blockStart--
        const blockSize = prev - blockStart + 1
        const firstCommentText = lines[blockStart].replace(/^\s*\/\/\s*/, '')
        const looksLikeDoc = blockSize >= 2 || /^[A-Z]/.test(firstCommentText)
        if (looksLikeDoc) {
          violations.push({ file, line: blockStart + 1, message: 'Use JavaDoc /** ... */ above a class/interface/struct/enum - not // line comments.' })
        }
      }
    }
    return violations
  },
}
