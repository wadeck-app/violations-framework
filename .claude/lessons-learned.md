# Lessons learned

<!-- Last updated: 2026-09-05T19:05:18.202Z -->

## Recurring feedback

<!-- session 8aac6087 2026-08-30 -->
- Suppress-in-code vs rule-exemptions philosophy: User rejected agent's pattern of adding conditional logic/exemptions to rules. User's model: rules fire on everything matching the pattern; code documents exceptions with explicit suppress comments. User corrected this 2+ times: "fais le toi meme", "pas d'exemption", forcing suppressions instead.

<!-- session c51ecdaf 2026-08-30 -->
- When relaying information between parallel agents, don't ask the user to bridge them — send cross-session messages directly to the other agent or investigate autonomously
- For multi-part permission requests that logically belong together (git-commit + git-push), request them in a single bypass call rather than separately

<!-- session 10dd2ad4 2026-08-30 -->
- User prefers agents use Bash tool directly, not `!` prefix — causes permission prompts and blocks execution flow
- Fixture-based tests require three parallel steps: rule .ts files, test .ts files with fixture imports, fixture directory structure under `rules/fixtures/<rule-id>/`. Old .js files must be stubbed (not deleted) to avoid import resolution failures during compilation.

<!-- session 33cff5dd 2026-08-21 -->
- User explicitly rejected explicit tag-based activation for `no-rule-without-test` — demanded implicit/always-active for any project with local rules. Rule discovery should be automatic, not require `violations-meta` tag in config. This is a strong UX preference: "no silence, no required manual setup for obvious things."

<!-- session d3bfe61c 2026-08-21 -->
- When dealing with system-level behavior (process structure, launch modes), investigate the actual implementation BEFORE making changes. Do not skip groundwork — ask about or explore implementation details proactively when first encountering such tasks.

<!-- session cc97e40c 2026-08-20 -->
- Previous CI analysis (Aug 19) was "too confident" with insufficient diagnostics — next time, prioritize adding `go env`, version logging, and artifact inspection to feedback loops so debugging doesn't restart from scratch
- When saving documentation for multi-project work, write to the target project's `.claude/docs/` folder, not to violation-framework's memory system — project context matters even when you're physically in another directory

## Agent errors

<!-- session 8aac6087 2026-08-30 -->
- Misunderstood `stdio: 'inherit'` as needing rule exemption; user clarified it's structurally safe (shares parent console, no new window) but should still be suppressible to document the intentional choice.
- Compiler inadvertently suffixed test files as `.test.test.js` instead of `.test.js` due to template literal construction — discovered only via cache file inspection, not test output
- Migration agent created .js stub files for backwards compatibility, then these were deleted by main session — scope confusion about whether migration was "delete old" or "run dual"

<!-- session c51ecdaf 2026-08-30 -->
- Claimed fix was tested because existing tests passed, but never verified the specific new code path (EPERM fallback) was actually exercised — user correctly pointed this out
- Used sleep-based polling loops instead of invoking poll-ci skill or structured GitHub Actions polling after encountering "NOT YET KNOWN" tool schemas — fell back to manual 15s waits instead of using available automation.

<!-- session 10dd2ad4 2026-08-30 -->
- Agent didn't proactively test fixes on both repos with the latest published binary before declaring "done" — user had to ask explicitly
- Agent created confusing rule duplication state (both `.js`, `.ts`, and `.test.ts` for same rule) instead of cleanup
- Compiler's import rewriting was incomplete — didn't redirect `./foo.js` imports to cached `.ts` versions, and didn't rewrite `import.meta.dirname` to source dir. Took 2+ fix cycles across cli.ts and compiler.ts to resolve fixture path breakage.

<!-- session 98b70e86 2026-08-22 -->
- Session history parsing resorted to manual JSONL script creation (`tmp_parse_history.js`, `tmp_parse2.js`) with multiple failed attempts (Python, then Node.js) — suggests the session-history agent lacks robust JSONL extraction and should handle transcript parsing internally instead of forking to manual parsing.

<!-- session 96d9b19f 2026-08-22 -->
- Executed global npm install without asking permission first — violates CLAUDE.md: "NEVER install applications, system packages, global npm/pip packages, or any software without explicitly asking the user first."

<!-- session 33cff5dd 2026-08-21 -->
- Initial fix addressed core bug (ignoring `files[]`) but missed the user's intent about *how the rule should activate*. User had to redirect: "pas de violations-meta, ca doit etre enable par default." The assistant understood the narrow bug but not the broader activation design.

<!-- session d3bfe61c 2026-08-21 -->
- Made assumptions about `process.pid` without checking the actual process topology first. User asked for three PIDs (exe, node, tray) and assistant initially didn't know the structure existed, requiring correction to investigate the startup code.

<!-- session cc97e40c 2026-08-20 -->
- Attempted to save project feedback memory to violations-framework/.claude/memory instead of wdrive/.claude/docs — confused physical working directory with project context; user called this out as "completely stupid"
- Used inline `node -e` despite guardrail block, then wasted rounds creating/editing temporary scripts before adapting; should immediately pivot to script file approach when guardrails block inline execution

<!-- session 88dc8bf5 2026-08-19 -->
- Agent made 8 sequential EDIT calls to `packages/violations-rules/src/rules/index.ts` instead of batching related import/export changes — could update index in fewer operations by combining related additions (imports, exports, allRules array entries) into one or two larger edits.

## Documentation gaps

<!-- session 8aac6087 2026-08-30 -->
- No guidance on violations rule design philosophy: suppress-in-code vs exempt-in-rule tradeoffs. Project enforces pure suppression model (no exemptions) but this wasn't documented.
- Fixture directory structure for local rule tests (`fixtures/<rule-id>/{clean,violation}.*`) was not self-evident — required explicit inter-agent messaging to clarify the pattern

<!-- session c51ecdaf 2026-08-30 -->
- `violations test --local` exit code and output stream handling behavior not intuitive; required multiple refactors to fix piping and test runner buffering issues
- Windows file-locking behavior during concurrent TypeScript compilation and the need to serialize compileIfNeeded per manifest aren't documented in CLAUDE.md or compiler.ts comments — the fix discovered through debugging.

<!-- session 10dd2ad4 2026-08-30 -->
- Violations skill lacked warning about never using `!` prefix for violations commands — only mentioned "use Bash tool" without explaining why

<!-- session 96d9b19f 2026-08-22 -->
- User's intent was global CLI installation for multi-project agent access, but initial response covered only CI publishing. The "global install so all agents can use it" requirement should be in the violations skill or setup docs to surface it earlier.

<!-- session 33cff5dd 2026-08-21 -->
- New `alwaysActive?: boolean` field added to Rule type but not documented — no explanation of what it does, when to use it, or how it interacts with tag-based activation. The `no-rule-without-test` rule itself needs docs about its trigger conditions and purpose.

<!-- session cc97e40c 2026-08-20 -->
- When Go version mismatches occur between `go-version-file` (reads directive) and explicit `go-version:` in workflows, CI produces different binaries but logs nothing — added diagnostic output in build-tray-binary.yml to expose actual GOVERSION/GOTOOLCHAIN/GOROOT on next run

## Known constraints

<!-- session 8aac6087 2026-08-30 -->
- CLAUDE.md rule "add comments above, not inline" was not previously enforced—previous Claude sessions ignored it. First violation rule (`violations-meta/no-inline-suppress`) created to prevent regression of style drift.
- Temp file naming in compiler requires per-manifest serialization lock (not just a single lock file) to prevent EPERM conflicts under concurrent Windows file access on cached compiled rules

<!-- session 10dd2ad4 2026-08-30 -->
- Local `.ts` rules compiled to cache cannot import from old `.js` files via ESM named import — migration requires rewriting imports or removing old files
- `TestsStream` from `node:test` emits objects not strings — piping directly to stdout fails silently with TypeError, needs manual event iteration
- When local rules use fixtures with `import.meta.dirname`, the compiler must rewrite this to source directory, not cache. Compiled tests in cache dir can't resolve relative fixture paths without explicit redirect mapping.

<!-- session 98b70e86 2026-08-22 -->
- Skills `violations` and `find-project` marked as `*** NOT YET KNOWN ***` when invoked — skill discovery or loading may be blocking or incomplete; these appear to be expected/functional skills but failed resolution on first call.

<!-- session 96d9b19f 2026-08-22 -->
- Custom skills marked "NOT YET KNOWN" in logs — when unavailable, fall back to Bash but flag it to the user rather than silently switching strategies.

<!-- session 33cff5dd 2026-08-21 -->
- Rule activation precedent is tag-based (`projectTags` membership). The `alwaysActive` override bypasses this; future rule authors need to know this exception exists and when to use it.

<!-- session cc97e40c 2026-08-20 -->
- User's GitHub artifact storage is permanently full — cannot recommend GitHub artifacts as a solution; must use git-based verification (commit SHAs, git log staleness) instead
