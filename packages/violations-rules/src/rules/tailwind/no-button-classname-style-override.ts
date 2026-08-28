import { readFile } from 'node:fs/promises'
import type { Rule, Violation } from '../types.js'

export type Config = Record<never, never>

// Detects <Button ... className="..." (inline string literal - NOT a JSX expression)
const BUTTON_CLASSNAME_INLINE_RE = /<Button[^>]*\bclassName=["']([^"']*)["']/

// Style-token patterns that indicate visual overrides (not layout)
const STYLE_TOKEN_RES: RegExp[] = [
  /\btext-[a-z]/,  // text-red-500, text-sm
  /\bbg-[a-z]/,    // bg-blue-500, bg-transparent
  /\bfont-[a-z]/,  // font-bold, font-semibold
  /\bpx-\d/,       // px-2, px-4
  /\bpy-\d/,       // py-2, py-4
]

function hasStyleToken(className: string): boolean {
  return STYLE_TOKEN_RES.some(re => re.test(className))
}

export const rule: Rule<Config> = {
  id: 'tailwind/no-button-classname-style-override',
  tags: 'tailwind',
  defaultScope: ['**/*.tsx'],
  defaultSeverity: 'warning',

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
      for (let i = 0; i < lines.length; i++) {
        const m = BUTTON_CLASSNAME_INLINE_RE.exec(lines[i])
        if (!m) continue
        const className = m[1]
        if (!hasStyleToken(className)) continue
        violations.push({
          file,
          line: i + 1,
          message: `Button className="${className}" contains style tokens - use a variant prop instead`,
        })
      }
    }

    return violations
  },
}
