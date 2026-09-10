import { readFile } from 'node:fs/promises'
import type { Rule, Violation } from '../types.js'

export type Config = Record<never, never>

const OS_HOMEDIR_RE = /\bos\.homedir\s*\(\s*\)/
const ENV_HOME_RE = /\bprocess\.env\.(HOME|USERPROFILE)\b/
// violations-suppress: shared/no-out-of-repo-path intentional test fixture
const WIN_ABS_PATH_RE = /['"`][A-Za-z]:[/\\]/

export const rule: Rule<Config> = {
  id: 'shared/no-out-of-repo-path',
  tags: 'shared',
  defaultScope: ['**/*.ts', '**/*.tsx', '**/*.js', '**/*.mjs', '**/*.cjs'],
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
        if (OS_HOMEDIR_RE.test(line)) {
          violations.push({
            file,
            line: i + 1,
            message:
              'os.homedir() constructs a path outside the repository - use __dirname-relative paths or inject via a dedicated env var at startup. Hardcoded home paths silently fail in CI.',
          })
        } else if (ENV_HOME_RE.test(line)) {
          violations.push({
            file,
            line: i + 1,
            message:
              'process.env.HOME/USERPROFILE constructs a path outside the repository - use __dirname-relative paths or inject via a dedicated env var instead.',
          })
        } else if (WIN_ABS_PATH_RE.test(line)) {
          violations.push({
            file,
            line: i + 1,
            message:
              'Hardcoded absolute Windows path exits the repository root - use __dirname-relative paths or an env var injected at startup. This silently fails in CI.',
          })
        }
      }
    }

    return violations
  },
}
