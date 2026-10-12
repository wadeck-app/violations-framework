import { readFile } from 'node:fs/promises'
import type { Rule, Violation } from '../types.js'

export type Config = Record<never, never>

// Module DSL views must theme via dsl-ui semantic props/ThemeScope, not raw
// colors or fixed Tailwind palette classes - those don't switch between
// light/dark app-core themes. Plain per-line text scan, no YAML parser;
// lines whose trimmed text starts with '#' (a YAML comment) are skipped.
// Trailing comments (e.g. `key: x  # bg-white`) are not excluded and would
// still be flagged - an accepted false positive, not worth the complexity
// of comment-stripping in a scope this narrow.
const UTILITY = 'bg|text|border|ring|fill|stroke|from|to|via|divide|outline|decoration|shadow|accent|caret'
const PALETTE = 'slate|gray|zinc|neutral|stone|red|orange|amber|yellow|lime|green|emerald|teal|cyan|sky|blue|indigo|violet|purple|fuchsia|pink|rose'

const PATTERNS: Array<{ kind: string; regex: RegExp; message: (match: string) => string }> = [
  {
    kind: 'hex-color',
    regex: /["']#(?:[0-9a-fA-F]{3,4}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})["']/,
    message: (match) =>
      `Raw color ${match} in a module view. Colors must come from the theme so the view works in light and dark: use a component's semantic prop (e.g. Badge \`variant\`: success|warning|danger|info|primary|default) or wrap the subtree in \`ThemeScope\`. See packages/app-core-sdk/README.md, section 'Dark theme'.`,
  },
  {
    kind: 'functional-color',
    regex: /\b(?:rgba?|hsla?)\(/,
    message: (match) =>
      `Raw color ${match} in a module view. Colors must come from the theme so the view works in light and dark: use a component's semantic prop (e.g. Badge \`variant\`: success|warning|danger|info|primary|default) or wrap the subtree in \`ThemeScope\`. See packages/app-core-sdk/README.md, section 'Dark theme'.`,
  },
  {
    kind: 'fixed-palette-class',
    regex: new RegExp(`(?<![\\w-])(?:${UTILITY})-(?:white|black|(?:${PALETTE})-\\d{2,3})(?![\\w-])`),
    message: (match) =>
      `Raw color ${match} in a module view. Colors must come from the theme so the view works in light and dark: use a component's semantic prop (e.g. Badge \`variant\`: success|warning|danger|info|primary|default) or wrap the subtree in \`ThemeScope\`. See packages/app-core-sdk/README.md, section 'Dark theme'.`,
  },
  {
    kind: 'dark-variant',
    regex: /(?<![\w-])dark:[a-z]/,
    message: (match) => `\`dark:\` variant ${match} in a module view. Theme tokens already switch with the app theme; remove the variant.`,
  },
]

export const rule: Rule<Config> = {
  id: 'app-module/no-raw-color-in-views',
  tags: 'app-module',
  alwaysActive: true,
  defaultScope: ['packages/app-module-*/dsl-frontend/**/*.yaml', 'packages/app-module-*/dsl-frontend/**/*.yml'],
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
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i]
        if (line.trimStart().startsWith('#')) {
          continue;
        }

        for (const { regex, message } of PATTERNS) {
          const m = regex.exec(line)
          if (!m) {
            continue;
          }
          violations.push({ file, line: i + 1, message: message(m[0]) })
        }
      }
    }

    return violations
  },
}
