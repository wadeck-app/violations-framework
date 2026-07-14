import { readFile } from 'node:fs/promises'
import type { Rule, Violation } from '../../types.js'

export type Config = Record<never, never>

function makePrefixRule(
  id: string,
  prefix: string,
  requiredDirective: string,
): Rule<Config> {
  const prefixPattern = new RegExp(`\\b${prefix}\\w+`)

  return {
    id,
    tags: 'unity',
    defaultScope: ['Assets/Scripts/**/*.cs'],
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

        // Stack of active #if directive conditions.
        // Each entry is the condition string or null (for #else branch).
        const ifStack: (string | null)[] = []
        let inBlockComment = false

        for (let i = 0; i < lines.length; i++) {
          const raw = lines[i]
          const trimmed = raw.trimStart()

          // Track block comment state
          if (inBlockComment) {
            if (raw.includes('*/')) inBlockComment = false
            continue
          }
          if (raw.includes('/*') && !raw.includes('*/')) {
            inBlockComment = true
          }

          // Handle preprocessor directives
          if (trimmed.startsWith('#if ') || trimmed.startsWith('#if\t')) {
            ifStack.push(trimmed.slice(3).trim())
            continue
          }
          if (trimmed.startsWith('#elif ') || trimmed.startsWith('#elif\t')) {
            if (ifStack.length > 0) ifStack[ifStack.length - 1] = trimmed.slice(5).trim()
            continue
          }
          if (trimmed.startsWith('#else')) {
            if (ifStack.length > 0) ifStack[ifStack.length - 1] = null
            continue
          }
          if (trimmed.startsWith('#endif')) {
            ifStack.pop()
            continue
          }

          // Skip line comments
          if (trimmed.startsWith('//')) continue

          // Check if requiredDirective is currently active in the if-stack
          const isGuarded = ifStack.some(cond => cond !== null && cond.includes(requiredDirective))

          if (!isGuarded && prefixPattern.test(raw)) {
            violations.push({
              file,
              line: i + 1,
              message: `'${prefix}' identifier used outside '#if ${requiredDirective}' block.`,
            })
          }
        }
      }
      return violations
    },
  }
}

export const editorPrefixGuard: Rule<Config> = makePrefixRule(
  'unity/editor-prefix-guard',
  'Editor_',
  'UNITY_EDITOR',
)

export const unitTestPrefixGuard: Rule<Config> = makePrefixRule(
  'unity/unit-test-prefix-guard',
  'UnitTest_',
  'UNITY_INCLUDE_TESTS',
)
