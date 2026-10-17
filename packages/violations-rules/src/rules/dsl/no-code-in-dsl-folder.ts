import { basename, extname } from 'node:path'
import type { Rule, Violation } from '../types.js'

export type Config = Record<never, never>

const YAML_EXTENSIONS = new Set(['.yaml', '.yml'])

const DSL_DIR_RE = /(?:^|[\\/])packages[\\/][^\\/]+-app[\\/]src[\\/]dsl[\\/]/

// A DSL app's src/dsl/ holds YAML only (at any depth). Code belongs in src/ or,
// when shared, in @wadeck-app/dsl-renderer.
export const rule: Rule<Config> = {
  id: 'dsl/no-code-in-dsl-folder',
  tags: 'dsl',
  defaultScope: ['packages/*-app/src/dsl/**'],
  defaultSeverity: 'error',

  async check(files: string[], _config: Config): Promise<Violation[]> {
    const violations: Violation[] = []

    for (const file of files) {
      if (!DSL_DIR_RE.test(file)) {
        continue
      }
      if (YAML_EXTENSIONS.has(extname(file).toLowerCase())) {
        continue
      }
      violations.push({
        file,
        line: 1,
        message: `'${basename(file)}' is not YAML. src/dsl/ holds YAML only (.yaml/.yml); move code to src/ or promote it to @wadeck-app/dsl-renderer.`,
      })
    }

    return violations
  },
}
