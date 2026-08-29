# Gap remediation — violations-cli CLI best practices

Source: gap analysis against `~/.claude/docs/cli/`.

## CRITICAL

- [ ] **`violations cli self-check`** — updater calls `violations cli self-check` post-install but the `cli` group and command don't exist; updater currently uses `--help` as a substitute which gives no real health signal. Implement `runSelfChecks(): CheckResult[]` with typed checks: bundle version not `undefined`, config dir writable, TypeScript compiler API loadable. Respect `CLI_SELF_CHECK_QUIET=1`. Exit 0/1.

## Auto-update

- [ ] **`scheduleBackgroundUpdate` in `finally {}`** — currently called before command dispatch (line 581 of cli.ts); a `process.exit()` mid-command won't reach it. Move into a `try/finally` wrapping the full command dispatch.

## Base commands

- [ ] **Subcommand `--help`** — `violations rules --help`, `violations config --help`, `violations cache --help` all fall through to unknown-command. Add `--help`/`-h` check on `rest[0]` for each group, with a `*_GROUP_HELP` constant per group.
- [ ] **Exit codes in `--help`** — add exit codes table to `printUsage()`: 0=ok, 1=error, N=violation count (for `check`).
- [ ] **Env vars in `--help`** — document `VIOLATIONS_CONFIG_DIR` (to add) and `CLI_SELF_CHECK_QUIET`.
- [ ] **`VIOLATIONS_CONFIG_DIR` env var** — add override in `main()` before `ConfigDir.get('violations')`, consistent with other CLIs.
- [ ] **`violations cli` command group** — the `cli` group doesn't exist yet (unlike flow-cli's `buildCliCommand()`); create it first, then add subcommands below.
- [ ] **`violations cli update`** — add manual foreground update following flow-cli pattern (`CliCommand.ts:238-275`).

## UX

- [ ] **`[ok]`/`[fail]` consistency** — subcommand success messages (`Config is valid.`, `Cache cleared.`) should use `[ok]` / `[fail]` prefix.
- [ ] **TTY detection + `--json`** — add to list-style outputs (`rules list`, `config check`).

## Config

## Dev

- [ ] **Entry point guard** — wrap `main()` call with `isEntryPoint` check to allow importing for tests.
- [ ] **`runCli(argv, deps)` export** — refactor `main()` to accept `argv` + injectable deps so tests don't touch `process.argv` or `process.exit`.
- [ ] **`preversion` guard** — add `"preversion": "node -e \"if (!process.env.CI) { process.exit(1); }\""` to package.json.
- [ ] **Script `clean`** — add `"clean": "rimraf dist dist-bundle"` to package.json.
