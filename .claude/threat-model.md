# Threat Model — violations-framework

## Reliability

| Risk | Mitigation |
|---|---|
| Windows NTFS EPERM on concurrent manifest writes | Per-manifest serialization lock (`compileLocks` Map) in `compiler.ts` — serializes all `compileIfNeeded` calls for the same manifest |
| Compiled cache resolving wrong paths | Relative imports rewritten to `file://` absolute URLs; `import.meta.dirname` rewritten to source dir at compile time |
| Broken update leaves CLI unusable | Post-update `violations cli self-check`; rollback restores previous version on failure |
| `process.exit()` skipping auto-update | Auto-update runs in `finally {}` — always executes regardless of exit path |

## Data integrity

- Reports are gitignored via `.violations/.gitignore` — never accidentally committed.
- Compiled rule cache is invalidated by manifest hash — stale caches are recompiled automatically.

## Accepted risks

- No cryptographic signing of rule packages — trust model is npm registry auth only.
- `violations cli self-check` quiet mode requires `CLI_SELF_CHECK_QUIET=1` env var in CI — absent var produces visible but harmless output.
- GitHub artifact storage is permanently full — CI must use git-based verification (commit SHA, git log) instead of artifact inspection.

## From lessons learned

- Concurrent `compileIfNeeded` calls for the same manifest (e.g. via `Promise.all`) trigger Windows NTFS EPERM — the `compileLocks` Map serializes calls per manifest path; do not bypass this with parallel compilation.
- `TestsStream` from `node:test` emits objects, not strings — piping directly to stdout fails silently with `TypeError`; iterate events manually.
- `violations test --local` exit code and output stream behavior are non-obvious; do not assume piping or buffering behaves like standard CLI tools without testing.
