import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import type { Rule, Violation } from '../types.js'
import { moduleRootOfRootFile, OUTPUT_DIR } from './layout.js'

export type Config = Record<never, never>

// dist-module is generated, so it is gitignored, and it is the only thing published
// (package.json "files": ["dist-module"]). Mirrors `app-core-cli check`.
export const rule: Rule<Config> = {
  id: 'app-module/publishing',
  tags: 'app-module',
  alwaysActive: true,
  defaultScope: ['**/app-module-*/manifest.json'],
  defaultSeverity: 'error',

  async check(files: string[], _config: Config): Promise<Violation[]> {
    const violations: Violation[] = []

    for (const manifestPath of files) {
      const root = moduleRootOfRootFile(manifestPath)
      if (root === undefined) {
        continue
      }

      const gitignore = join(root, '.gitignore')
      if (!existsSync(gitignore)) {
        violations.push({ file: gitignore, line: 1, message: `missing; ${OUTPUT_DIR} must be gitignored. Create .gitignore containing the line "${OUTPUT_DIR}".` })
      } else {
        const lines = readFileSync(gitignore, 'utf-8').split(/\r?\n/).map((l) => l.trim())
        if (!lines.some((line) => /^\/?dist-module\/?$/.test(line))) {
          violations.push({ file: gitignore, line: 1, message: `does not ignore ${OUTPUT_DIR}, which is generated. Add the line "${OUTPUT_DIR}".` })
        }
      }

      const packageJson = join(root, 'package.json')
      if (!existsSync(packageJson)) {
        continue
      }
      let parsed: unknown
      try {
        parsed = JSON.parse(readFileSync(packageJson, 'utf-8'))
      } catch (err) {
        violations.push({ file: packageJson, line: 1, message: `is not valid JSON: ${(err as Error).message}` })
        continue
      }
      const pkgFiles = typeof parsed === 'object' && parsed !== null ? (parsed as { files?: unknown }).files : undefined
      if (!Array.isArray(pkgFiles) || pkgFiles.length !== 1 || pkgFiles[0] !== OUTPUT_DIR) {
        violations.push({ file: packageJson, line: 1, message: `"files" is ${JSON.stringify(pkgFiles)}, but only ${OUTPUT_DIR} may be published. Set "files": ["${OUTPUT_DIR}"].` })
      }
    }

    return violations
  },
}
