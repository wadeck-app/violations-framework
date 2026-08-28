import { readFile } from 'node:fs/promises'
import type { Rule, Violation } from '../types.js'

export type Config = Record<never, never>

const ATOMIC_RE = /@registryCategory\s+atomic/

function isAtomic(text: string): boolean {
  return ATOMIC_RE.test(text)
}

// Full list of Tailwind palette color families
const COLOR_FAMILIES = [
  'slate', 'gray', 'zinc', 'neutral', 'stone',
  'red', 'orange', 'amber', 'yellow', 'lime', 'green', 'emerald', 'teal',
  'cyan', 'sky', 'blue', 'indigo', 'violet', 'purple', 'fuchsia', 'pink', 'rose',
]

// All variant prefixes that can carry a raw palette color
const RAW_COLOR_RE = new RegExp(
  `\\b(?:bg|text|border|ring|divide|from|via|to|placeholder|decoration|outline|accent|caret|fill|stroke)-(?:${COLOR_FAMILIES.join('|')})-\\d{2,3}\\b`,
)

export const rule: Rule<Config> = {
  id: 'tailwind/no-raw-color-class',
  tags: 'tailwind',
  defaultScope: ['**/*.tsx', '**/*.ts'],
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

      const lines = text.split('\n')

      // Atomic components are the correct owners of domain-semantic color mappings
      if (isAtomic(text)) continue

      for (let i = 0; i < lines.length; i++) {
        if (!RAW_COLOR_RE.test(lines[i])) continue
        violations.push({
          file,
          line: i + 1,
          message:
            'Raw Tailwind color-palette class found - use a semantic theme token instead (bg-surface, text-muted, bg-success, border-danger, etc.)',
        })
      }
    }

    return violations
  },
}
