import { describe, it } from 'node:test'
import type { Rule, Violation, Severity, RuleOverride, ViolationsConfig, RuleResult, SuppressDirective, CacheManifest } from './types.js'

describe('Rule<Config> type constraints', () => {
  it('accepts a valid Rule<{ maxLines: number }> object', () => {
    // violations-suppress: shared/no-em-dash intentional test fixture
    // This is a compile-time type test — if the types are wrong, tsc will reject this file.
    const rule: Rule<{ maxLines: number }> = {
      id: 'ts/no-long-file',
      tags: 'ts',
      defaultScope: ['**/*.ts'],
      defaultSeverity: 'warning',
      async check(files: string[], config: { maxLines: number }): Promise<Violation[]> {
        // config.maxLines is accessible and typed as number
        const _limit: number = config.maxLines
        void files
        void _limit
        return []
      },
    }

    // Verify runtime shape too
    if (rule.id !== 'ts/no-long-file') throw new Error('id mismatch')
    if (rule.tags !== 'ts') throw new Error('tags mismatch')
    if (rule.defaultScope[0] !== '**/*.ts') throw new Error('defaultScope mismatch')
    if (rule.defaultSeverity !== 'warning') throw new Error('defaultSeverity mismatch')
  })

  it('accepts a Rule with no config (defaults to Record<string, never>)', () => {
    const rule: Rule = {
      id: 'shared/no-em-dash',
      tags: 'shared',
      defaultScope: ['**/*.ts', '**/*.tsx', '**/*.md'],
      defaultSeverity: 'error',
      async check(_files: string[], _config: Record<string, never>): Promise<Violation[]> {
        return []
      },
    }
    if (rule.id !== 'shared/no-em-dash') throw new Error('id mismatch')
  })

  it('Severity is a union of three literals', () => {
    const severities: Severity[] = ['error', 'warning', 'info']
    if (severities.length !== 3) throw new Error('unexpected severity count')
  })

  it('RuleOverride accepts $severity, $scopeAdd, $exclude, and Partial<Config>', () => {
    const override: RuleOverride<{ maxLines?: number }> = {
      $severity: 'warning',
      $scopeAdd: ['packages/extra/**'],
      $exclude: ['**/generated/**'],
      maxLines: 120,
    }
    if (override.$severity !== 'warning') throw new Error('$severity mismatch')
  })

  it('RuleOverride allows $severity: false to disable a rule', () => {
    const override: RuleOverride = { $severity: false }
    if (override.$severity !== false) throw new Error('$severity false mismatch')
  })

  it('ViolationsConfig accepts projectTags and rule overrides', () => {
    const config: ViolationsConfig = {
      projectTags: ['ts', 'react'],
      globalExclude: ['**/node_modules/**'],
      rules: {
        'shared/readme-system-length': { $severity: 'warning', maxLines: 80 },
        'ts/no-export-star': { $exclude: ['**/generated/**'] },
        'ts/no-barrel-index': { $severity: false },
        './.violations/rules/my-rule.js': true,
      },
    }
    if (!config.projectTags.includes('ts')) throw new Error('projectTags mismatch')
  })

  it('RuleResult has correct shape', () => {
    const result: RuleResult = {
      ruleId: 'ts/no-export-star',
      severity: 'error',
      violations: [{ file: '/abs/path/foo.ts', line: 1, message: 'no export *' }],
      suppressed: [],
      counts: { violations: 1, suppressed: 0 },
    }
    if (result.counts.violations !== 1) throw new Error('counts mismatch')
  })

  it('SuppressDirective is a discriminated union on kind', () => {
    const inline: SuppressDirective = { kind: 'inline', ruleId: 'ts/no-export-star', line: 10 }
    const start: SuppressDirective = { kind: 'start', ruleId: 'ts/no-export-star', reason: 'legacy', line: 5 }
    const end: SuppressDirective = { kind: 'end', ruleId: 'ts/no-export-star', line: 20 }
    if (inline.kind !== 'inline') throw new Error('inline kind mismatch')
    if (start.kind !== 'start') throw new Error('start kind mismatch')
    if (end.kind !== 'end') throw new Error('end kind mismatch')
  })

  it('CacheManifest has frameworkVersion and files map', () => {
    const manifest: CacheManifest = {
      frameworkVersion: '0.1.0',
      files: {
        '/abs/path/.violations/rules/my-rule.ts': {
          mtimeMs: 1720000000000,
          compiledPath: '/abs/path/.violations/.cache/my-rule.js',
        },
      },
    }
    if (manifest.frameworkVersion !== '0.1.0') throw new Error('frameworkVersion mismatch')
  })
})
