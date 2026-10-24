import { readFile } from 'node:fs/promises'
import { isAbsolute, relative, sep } from 'node:path'
import type { Rule, Violation } from '../types.js'

export type Config = Record<never, never>

const PACKAGE_PATTERN = String.raw`['"]@wadeck-app\/queue-sdk['"]`
const FUNCTION_NAME = 'createQueuePublisher'
const TEST_SEGMENTS = new Set(['__tests__', 'tests', 'test', 'testing', 'e2e', 'fixtures'])
const IDENTIFIER = /[A-Za-z_$][\w$]*/y

const MESSAGE =
  'queue-sdk `off` is for automated tests only: it drops every event silently in production. ' +
  'For a development run set the environment variable QUEUE_SDK_OFF=1 (it warns once); see packages/queue-sdk/docs/reference.md'

// Test files may use `off`: *.test.*, *.spec.*, or a __tests__/tests/test/testing/e2e/fixtures folder. The path is taken
// relative to the working directory (the project root) so that a repository checked out under a folder named "test" is not
// skipped as a whole.
function isTestFile(file: string): boolean {
  const rel = relative(process.cwd(), file)
  const path = (rel.startsWith('..') || isAbsolute(rel) ? file : rel).split(sep).join('/').replaceAll('\\', '/')
  const segments = path.split('/')
  const name = segments[segments.length - 1]
  return /\.(test|spec)\.[^/]+$/.test(name) || segments.slice(0, -1).some((segment) => TEST_SEGMENTS.has(segment))
}

// Index just after the string or template literal that starts at `start` (a quote or a backtick).
function skipString(text: string, start: number): number {
  const quote = text[start]
  let i = start + 1
  while (i < text.length) {
    const ch = text[i]
    if (ch === '\\') {
      i += 2
    } else if (ch === quote) {
      return i + 1
    } else if (quote === '`' && ch === '$' && text[i + 1] === '{') {
      i = skipBraces(text, i + 1)
    } else {
      i++
    }
  }
  return text.length
}

// Index just after the `{ ... }` block that starts at `start`; not string-aware beyond nested literals.
function skipBraces(text: string, start: number): number {
  let depth = 0
  let i = start
  while (i < text.length) {
    const ch = text[i]
    if (ch === '"' || ch === "'" || ch === '`') {
      i = skipString(text, i)
      continue
    }
    if (ch === '{') {
      depth++
    } else if (ch === '}') {
      depth--
      if (depth === 0) {
        return i + 1
      }
    }
    i++
  }
  return text.length
}

// The text with every comment replaced by spaces (newlines kept), so offsets and line numbers stay valid.
function maskComments(text: string): string {
  let out = ''
  let i = 0
  while (i < text.length) {
    const ch = text[i]
    if (ch === '"' || ch === "'" || ch === '`') {
      const end = skipString(text, i)
      out += text.slice(i, end)
      i = end
    } else if (ch === '/' && text[i + 1] === '/') {
      while (i < text.length && text[i] !== '\n') {
        out += ' '
        i++
      }
    } else if (ch === '/' && text[i + 1] === '*') {
      const end = text.indexOf('*/', i + 2)
      const stop = end === -1 ? text.length : end + 2
      out += text.slice(i, stop).replace(/[^\n]/g, ' ')
      i = stop
    } else {
      out += ch
      i++
    }
  }
  return out
}

// The text with the inside of every string and template literal replaced by spaces (quotes and newlines kept), so that
// a call written in a string is not taken for a call. Expects comments to be masked already.
function maskStrings(code: string): string {
  let out = ''
  let i = 0
  while (i < code.length) {
    const ch = code[i]
    if (ch === '"' || ch === "'" || ch === '`') {
      const end = skipString(code, i)
      out += ch + code.slice(i + 1, end - 1).replace(/[^\n]/g, ' ') + (end - 1 > i ? code[end - 1] : '')
      i = end
    } else {
      out += ch
      i++
    }
  }
  return out
}

function nextNonSpace(text: string, from: number): number {
  let i = from
  while (i < text.length && /\s/.test(text[i])) {
    i++
  }
  return i
}

// Keys written directly in the object literal that opens at `open` (nested objects are not looked into).
// A key is `name:`, `'name':`, or a shorthand `name` followed by `,` or `}`. Methods, spreads and computed keys are skipped.
function topLevelKeys(text: string, open: number): Array<{ key: string; index: number }> {
  const keys: Array<{ key: string; index: number }> = []
  let depth = 1
  let expectKey = true
  let i = open + 1
  while (i < text.length && depth > 0) {
    const ch = text[i]
    if (/\s/.test(ch)) {
      i++
    } else if (ch === '"' || ch === "'" || ch === '`') {
      const end = skipString(text, i)
      if (depth === 1 && expectKey && ch !== '`' && text[nextNonSpace(text, end)] === ':') {
        keys.push({ key: text.slice(i + 1, end - 1), index: i })
      }
      if (depth === 1) {
        expectKey = false
      }
      i = end
    } else if (ch === '{' || ch === '[' || ch === '(') {
      depth++
      i++
    } else if (ch === '}' || ch === ']' || ch === ')') {
      depth--
      i++
    } else if (ch === ',' && depth === 1) {
      expectKey = true
      i++
    } else if (depth === 1 && expectKey && text.startsWith('...', i)) {
      expectKey = false
      i += 3
    } else if (depth === 1 && expectKey && /[A-Za-z_$]/.test(ch)) {
      IDENTIFIER.lastIndex = i
      const name = IDENTIFIER.exec(text)![0]
      const after = text[nextNonSpace(text, i + name.length)]
      if (after === ':' || after === ',' || after === '}') {
        keys.push({ key: name, index: i })
      }
      expectKey = false
      i += name.length
    } else {
      if (depth === 1) {
        expectKey = false
      }
      i++
    }
  }
  return keys
}

// Local names under which createQueuePublisher can be called, from the imports of the queue SDK in this file.
function localBindings(code: string): { functions: string[]; namespaces: string[] } {
  const functions: string[] = []
  const namespaces: string[] = []

  for (const match of code.matchAll(new RegExp(String.raw`import\s+(?!type\b)\{([^}]*)\}\s*from\s*${PACKAGE_PATTERN}`, 'g'))) {
    for (const specifier of match[1].split(',')) {
      const parsed = new RegExp(String.raw`^\s*(?:type\s+)?${FUNCTION_NAME}(?:\s+as\s+([\w$]+))?\s*$`).exec(specifier)
      if (parsed && !/^\s*type\s/.test(specifier)) {
        functions.push(parsed[1] ?? FUNCTION_NAME)
      }
    }
  }
  for (const match of code.matchAll(new RegExp(String.raw`import\s*\*\s*as\s+([\w$]+)\s+from\s*${PACKAGE_PATTERN}`, 'g'))) {
    namespaces.push(match[1])
  }
  for (const match of code.matchAll(new RegExp(String.raw`(?:const|let|var)\s*\{([^}]*)\}\s*=\s*require\(\s*${PACKAGE_PATTERN}\s*\)`, 'g'))) {
    for (const specifier of match[1].split(',')) {
      const parsed = new RegExp(String.raw`^\s*${FUNCTION_NAME}(?:\s*:\s*([\w$]+))?\s*$`).exec(specifier)
      if (parsed) {
        functions.push(parsed[1] ?? FUNCTION_NAME)
      }
    }
  }
  for (const match of code.matchAll(new RegExp(String.raw`(?:const|let|var)\s+([\w$]+)\s*=\s*require\(\s*${PACKAGE_PATTERN}\s*\)`, 'g'))) {
    namespaces.push(match[1])
  }
  return { functions, namespaces }
}

// Offset of the `(` of every call of createQueuePublisher, however it is imported.
function callOpenings(code: string, bindings: { functions: string[]; namespaces: string[] }): number[] {
  const openings: number[] = []
  const patterns = [
    ...bindings.functions.map((name) => new RegExp(String.raw`(?<![\w$.])${name.replaceAll('$', String.raw`\$`)}\s*\(`, 'g')),
    ...bindings.namespaces.map((name) => new RegExp(String.raw`(?<![\w$.])${name.replaceAll('$', String.raw`\$`)}\s*\.\s*${FUNCTION_NAME}\s*\(`, 'g')),
  ]
  for (const pattern of patterns) {
    for (const match of code.matchAll(pattern)) {
      openings.push(match.index + match[0].length)
    }
  }
  return openings
}

// The `{` of the options object of a call: written inline, or a variable declared as an object literal in the same file.
function optionsObject(code: string, argStart: number): number | undefined {
  const first = nextNonSpace(code, argStart)
  if (code[first] === '{') {
    return first
  }
  IDENTIFIER.lastIndex = first
  const ident = IDENTIFIER.exec(code)?.[0]
  if (ident === undefined || ![',', ')'].includes(code[nextNonSpace(code, first + ident.length)])) {
    return undefined
  }
  const declaration = new RegExp(String.raw`(?:const|let|var)\s+${ident.replaceAll('$', String.raw`\$`)}\b[^=;]*=\s*(\{)`).exec(code)
  return declaration === null ? undefined : declaration.index + declaration[0].length - 1
}

export const rule: Rule<Config> = {
  id: 'queue-sdk/no-off-outside-tests',
  tags: 'queue-sdk',
  alwaysActive: true,
  defaultScope: ['**/*.{ts,tsx,mts,cts,js,jsx,mjs,cjs}'],
  defaultSeverity: 'error',

  async check(files: string[], _config: Config): Promise<Violation[]> {
    const violations: Violation[] = []
    for (const file of files) {
      if (isTestFile(file)) {
        continue
      }
      const text = await readFile(file, 'utf8').catch(() => '')
      if (!text.includes('@wadeck-app/queue-sdk')) {
        continue
      }
      const code = maskComments(text)
      const bindings = localBindings(code)
      const reported = new Set<number>()
      for (const argStart of callOpenings(maskStrings(code), bindings)) {
        const open = optionsObject(code, argStart)
        if (open === undefined) {
          continue
        }
        for (const { key, index } of topLevelKeys(code, open)) {
          if (key === 'off' && !reported.has(index)) {
            reported.add(index)
            violations.push({ file, line: code.slice(0, index).split('\n').length, message: MESSAGE })
          }
        }
      }
    }
    return violations
  },
}
