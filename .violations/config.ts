import type { ViolationsConfig } from '@wadeck-app/violations-rules'

export default {
  projectTags: ['ts', 'violations-meta'],
  globalExclude: [
    '**/node_modules/**',
    '**/dist/**',
    '**/*.tsbuildinfo',
  ],
  rules: {
    // Shared rules: not auto-active via projectTags (tag is 'shared', not in projectTags)
    // Opt in explicitly:
    'shared/no-em-dash': true,
    'shared/partial-impl-flag': true,
    'shared/no-french': {
      // test fixtures contain French strings intentionally
      $exclude: [
        'packages/violations-rules/src/rules/shared/no-french.test.ts',
      ],
    },

    // ts rules: auto-active via 'ts' projectTag

    // violations-meta rules: auto-active via 'violations-meta' projectTag

    // no-legacy-violations-folder: suppress in this repo (we host migration tooling)
    'violations-meta/no-legacy-violations-folder': { $severity: false },

    // no-rule-without-test: exclude helper files (types.ts, index.ts)
    'violations-meta/no-rule-without-test': {
      $scopeAdd: ['packages/violations-rules/src/rules/**/*.ts'],
      $exclude: ['**/types.ts', '**/index.ts'],
    },
  },
} satisfies ViolationsConfig
