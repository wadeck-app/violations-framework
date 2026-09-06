# Guiding Principles — violations-framework

- Rules receive pre-filtered `files[]`; never call `walk()` inside a rule.
- Use `tags` (string, AND logic) for rule activation; declare only the most-specific tag — `react` implies `ts`, `unity` implies `cs`.
- `alwaysActive: true` bypasses tag-based activation — use only for rules that must fire in any project with local rules, without requiring a specific `projectTags` entry.
- `$scope` for full scope replacement is banned; use `$scopeAdd` to extend and `$exclude` to punch holes — full replacement creates activation blind spots.
- Reports write to `.violations/.reports/`; `.violations/.gitignore` excludes them automatically — never write to the project root.
- Auto-detect fallback applies when no `.violations/config.ts` is present: prints `[auto]` to stderr and runs with inferred tags — no silence on missing config.
- TypeScript compiler API (not esbuild/transpile-only) is used for local `.ts` rules — type-checking is part of the compile contract.
- Per-manifest serialization lock (`compileLocks` Map) must be maintained in `compiler.ts` to prevent Windows NTFS EPERM on concurrent writes.
- Relative imports in compiled rules are rewritten to absolute `file://` URLs; `import.meta.dirname` is rewritten to the source directory — do not break this rewrite logic.
- `Record<never, never>` is the correct default Config generic — `Record<string, never>` causes an index signature conflict in `RuleOverride` intersections.
- Version format: `1.0.YYYYMMDD-HHMMSS-BUILD-SHA` — CI-managed, never via `npm version`.
- `violations-rules` must be published before `violations-cli` on every release (CLI has it as a peer dep).
- Auto-update runs in `finally {}` to guarantee execution even when a command calls `process.exit()` mid-run.
- Post-update `violations cli self-check` must pass; rollback to the previous version if it fails.

## From lessons learned

- Run `violations rules list` before creating any new rule — duplicate rules are created when existing shared rules go undiscovered (e.g., `shared/no-em-dash` already existed).
- Violations `--files` flag requires absolute paths; relative paths silently produce no matches.
- Run `violations check` throughout development, not only at the end — rules surface incrementally and batch-catching at the end creates multi-pass fix cycles.
- Fixture-based tests require three parallel artifacts: the rule `.ts` file, a test `.ts` file with fixture imports, and the fixture directory under `rules/fixtures/<rule-id>/`. Old `.js` stubs must remain (not be deleted) to avoid import resolution failures during compilation.
- `alwaysActive: true` is the correct activation for meta-rules that must fire in any project with local rules (e.g., `no-rule-without-test`) — tag-based activation would require manual `violations-meta` tag in every consumer config, which is rejected UX.
- Local `.ts` rules compiled to cache cannot import from legacy `.js` files via ESM named import — migration requires rewriting imports or removing old `.js` files.
- When `import.meta.dirname` appears in local rules, the compiler rewrites it to the source directory, not the cache — do not break this rewrite; fixture paths depend on it.
- Cross-workspace testing (violations-framework → consumer repos) requires agent coordination via SendMessage; Windows EPERM on concurrent manifest compilation only manifests in remote workspaces, not in self-checks.
- When adding a new rule to `packages/violations-rules/src/rules/index.ts`, batch all related changes (imports, exports, `allRules` array) into a single Edit call.
- Use Bash tool directly for violations commands — never use the `!` prefix; it causes permission prompts that block execution flow.
- GitHub artifact storage for this account is permanently full — always use git-based verification (commit SHA, `git log`) instead of artifact inspection.
