import type { ViolationsConfig } from '@wadeck-app/violations-rules'

export default {
  projectTags: ['ts', 'violations-meta'],
  globalExclude: [
    '**/node_modules/**',
    '**/dist/**',
    '**/dist-bundle/**',
    '**/*.tsbuildinfo',
  ],
  rules: {
    // shared rules are now always active automatically.
    // Rules that need $exclude or $severity overrides are listed explicitly below.
    'shared/no-em-dash': {
      // runner.test.ts writes a file containing an em-dash to test the no-em-dash rule
      $exclude: [
        'packages/violations-cli/src/runner.test.ts',
      ],
    },
    'shared/no-french': {
      // test fixtures contain French/accented strings intentionally
      $exclude: [
        'packages/violations-rules/src/rules/shared/no-french.test.ts',
        'packages/violations-rules/src/rules/shared/no-emoji.test.ts',
      ],
    },
    'shared/no-emoji': {
      // test fixtures contain emoji/symbols intentionally
      $exclude: [
        'packages/violations-rules/src/rules/shared/no-emoji.test.ts',
        'packages/violations-rules/src/rules/shared/no-french.test.ts',
      ],
    },
    'shared/no-dead-suppress': {
      $exclude: [
        'packages/violations-rules/src/rules/shared/no-dead-suppress.test.ts',
        'packages/violations-cli/src/runner.test.ts',
        'packages/violations-rules/src/rules/violations-meta/no-inline-suppress.test.ts',
      ],
    },
    'shared/no-out-of-repo-path': {
      // test fixtures and rule source itself contain the patterns it detects
      $exclude: [
        'packages/violations-rules/src/rules/shared/no-out-of-repo-path.test.ts',
        'packages/violations-rules/src/rules/shared/no-out-of-repo-path.ts',
      ],
    },
    'shared/no-emoji': {
      $exclude: [
        'packages/violations-rules/src/rules/shared/no-emoji.test.ts',
        'packages/violations-rules/src/rules/shared/no-french.test.ts',
        'docs/**',
        'packages/violations-cli/src/cli.ts',
        'packages/violations-cli/src/compiler.ts',
      ],
    },
    'shared/readme-system-length': {
      // Framework README is documentation, not a system prompt
      $severity: false,
    },

    // ts rules: auto-active via 'ts' projectTag

    // Test files that test the exact pattern they would violate.
    // The violating code lives inside writeFile() string arguments (test fixtures),
    // which a grep-based rule cannot distinguish from production code.
    'ts/no-locale-date': {
      $exclude: [
        'packages/violations-rules/src/rules/ts/no-locale-date.test.ts',
      ],
    },
    'ts/no-err-message-direct': {
      $exclude: [
        'packages/violations-rules/src/rules/ts/no-err-message-direct.test.ts',
      ],
    },
    'ts/no-switch-default-break': {
      $exclude: [
        'packages/violations-rules/src/rules/ts/no-switch-default-break.test.ts',
      ],
    },
    'ts/no-union-with-string': {
      $exclude: [
        'packages/violations-rules/src/rules/ts/no-union-with-string.test.ts',
      ],
    },
    'ts/no-unsafe-type-cast': {
      $exclude: [
        'packages/violations-rules/src/rules/ts/no-unsafe-type-cast.test.ts',
      ],
    },
    'ts/no-cross-package-relative': {
      $exclude: [
        'packages/violations-rules/src/rules/ts/no-cross-package-relative.test.ts',
      ],
    },
    'ts/node-builtin-prefix': {
      $exclude: [
        'packages/violations-rules/src/rules/ts/node-builtin-prefix.test.ts',
      ],
    },

    // violations-meta rules: auto-active via 'violations-meta' projectTag

    // no-inline-suppress: exclude files where 'violations-suppress:' appears in string/regex
    // literals as part of rule implementations or test fixtures (false positives).
    'violations-meta/no-inline-suppress': {
      $exclude: [
        'packages/violations-cli/src/runner.test.ts',
        'packages/violations-cli/src/suppress.ts',
        'packages/violations-rules/src/rules/cs/no-redundant-fqn.ts',
        'packages/violations-rules/src/rules/shared/no-dead-suppress.ts',
        'packages/violations-rules/src/rules/shared/no-dead-suppress.test.ts',
        'packages/violations-rules/src/rules/violations-meta/no-inline-suppress.ts',
        'packages/violations-rules/src/rules/violations-meta/no-inline-suppress.test.ts',
      ],
    },

    // no-legacy-violations-folder: suppress in this repo (we host migration tooling)
    'violations-meta/no-legacy-violations-folder': { $severity: false },

    // no-rule-without-test: exclude helper files (types.ts, all-rules.ts) and test utilities
    'violations-meta/no-rule-without-test': {
      $scopeAdd: ['packages/violations-rules/src/rules/**/*.ts'],
      $exclude: ['**/types.ts', '**/all-rules.ts', '**/test-utils/**'],
    },
  },
} satisfies ViolationsConfig
