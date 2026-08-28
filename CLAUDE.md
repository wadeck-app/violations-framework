# violations-framework

Two npm packages that centralise code-quality violation rules across TypeScript, React, and C# projects.

## Local setup (one time)

Add to `~/.npmrc` to consume `@wadeck-app` packages from GitHub Packages:
```
@wadeck-app:registry=https://npm.pkg.github.com/
//npm.pkg.github.com/:_authToken=<GitHub PAT with read:packages scope>
```

```
@wadeck-app/violations-rules   <- rule definitions + TypeScript types
@wadeck-app/violations-cli     <- `violations` binary + runner + compiler
```

Published to GitHub Packages (`https://npm.pkg.github.com/`) on every push to `main`. Version format: `1.0.YYYYMMDD-HHMMSS-BUILD-SHA` (see `ci/scripts/compute-version.sh`).

---

## Dev commands

```bash
npm run build              # compile both packages (tsc)
npm test                   # run all 208+ tests (node:test)
node packages/violations-cli/dist/cli.js check   # self-check violations on this repo
```

---

## Project layout

```
packages/
  violations-rules/src/
    types.ts               <- Rule<Config>, Violation, RuleOverride, ViolationsConfig, RuleResult
    rules/
      shared/              <- language-agnostic rules
      ts/                  <- TypeScript rules
      cs/                  <- C# rules
      unity/               <- Unity/Mono rules
      react/               <- React/TSX rules
      tailwind/            <- Tailwind CSS rules
      violations-meta/     <- rules about the violations system itself
    index.ts               <- re-exports types + allRules array
  violations-cli/src/
    cli.ts                 <- binary entry point (violations check/test/rules/config/cache)
    runner.ts              <- orchestrator: loads config, resolves rules, runs checks
    compiler.ts            <- TypeScript compiler API: on-demand compile of local .ts rules
    suppress.ts            <- isSuppressed() - three suppress styles
    walk.ts                <- file tree walker with glob exclude support
    report.ts              <- writes .violations/.reports/
.violations/
  config.ts                <- this repo's own violations config (self-application)
ci/scripts/
  compute-version.sh       <- produces 1.0.YYYYMMDD-HHMMSS-BUILD-SHA
```

---

## Adding a rule

1. Create `packages/violations-rules/src/rules/<tag>/<id>.ts`:

```ts
import { readFile } from 'node:fs/promises'
import type { Rule, Violation } from '../../types.js'

export type Config = Record<never, never>

export const rule: Rule<Config> = {
  id: '<tag>/<id>',
  tags: '<tag>',                          // single tag, most-specific only
  defaultScope: ['**/*.ts'],
  defaultSeverity: 'error',
  async check(files: string[], _config: Config): Promise<Violation[]> {
    const violations: Violation[] = []
    for (const file of files) {
      const text = await readFile(file, 'utf8').catch(() => '')
      const lines = text.split('\n')
      for (let i = 0; i < lines.length; i++) {
        if (/* condition */) {
          violations.push({ file, line: i + 1, message: '...' })
        }
      }
    }
    return violations
  },
}
```

2. Create `<id>.test.ts` next to it - at minimum one true-positive and one true-negative using `node:test`.
3. Export from `src/rules/index.ts` and add to `allRules`.

Rules receive pre-filtered `files[]` - never call `walk()` inside a rule.

---

## Key design decisions

- **`tags: string`** (not array) - AND logic for activation; declare only the most-specific tag (`react` implies `ts`, `unity` implies `cs`).
- **`$scope` was dropped** - use `$scopeAdd` to extend and `$exclude` to punch holes. Full replacement creates blind spots.
- **TypeScript compiler API** (not esbuild) in `compiler.ts` - gives real type-checking of local `.ts` rules, not just transpilation.
- **`Record<never, never>`** as default Config generic - avoids index signature conflict that `Record<string, never>` causes in `RuleOverride` intersection.
- **Reports go in `.violations/.reports/`** - gitignored via `.violations/.gitignore`, never in project root.
- **`violations-meta/no-legacy-violations-folder`** suppressed in this repo - we host the migration tooling, `scripts/violations/` intentionally absent here.

---

## Suppress syntax

```ts
// violations-suppress: rule-id optional reason          <- same line or line above
// violations-suppress-start: rule-id                    <- open zone
// violations-suppress-end: rule-id                      <- close zone (omit = rest of file)
```

## CI

- `ci.yml` - runs on every push and PR (build + test)
- `publish.yml` - runs on every push to `main` (build + test + self-check + publish both packages)
- No repository secret needed — publishing uses the built-in `GITHUB_TOKEN`
- `violations-rules` is published before `violations-cli` (CLI has it as peer dep)
