import { readFile } from 'node:fs/promises'
import type { Rule, Violation } from '../types.js'

export type Config = Record<never, never>

const BUILTINS = new Set([
  'assert', 'assert/strict', 'buffer', 'child_process', 'cluster', 'console',
  'constants', 'crypto', 'dgram', 'diagnostics_channel', 'dns', 'dns/promises',
  'domain', 'events', 'fs', 'fs/promises', 'http', 'http2', 'https', 'inspector',
  'module', 'net', 'os', 'path', 'path/posix', 'path/win32', 'perf_hooks',
  'process', 'punycode', 'querystring', 'readline', 'readline/promises', 'repl',
  'stream', 'stream/consumers', 'stream/promises', 'stream/web', 'string_decoder',
  'sys', 'timers', 'timers/promises', 'tls', 'trace_events', 'tty', 'url', 'util',
  'util/types', 'v8', 'vm', 'wasi', 'worker_threads', 'zlib',
])

// Static import/export: from 'specifier'
const IMPORT_RE = /\bfrom\s+['"]([^'"]+)['"]/g
// CommonJS require() calls
const REQUIRE_RE = /\brequire\(['"]([^'"]+)['"]\)/g

export const rule: Rule<Config> = {
  id: 'ts/node-builtin-prefix',
  tags: 'ts',
  defaultScope: ['**/*.ts', '**/*.tsx', '**/*.js', '**/*.mjs'],
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
        for (const re of [IMPORT_RE, REQUIRE_RE]) {
          re.lastIndex = 0
          let m: RegExpExecArray | null
          while ((m = re.exec(line)) !== null) {
            const specifier = m[1]
            if (BUILTINS.has(specifier)) {
              violations.push({
                file,
                line: i + 1,
                message: `Import '${specifier}' must use the node: prefix: use 'node:${specifier}'`,
              })
            }
          }
        }
      }
    }
    return violations
  },
}
