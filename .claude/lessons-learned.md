# Lessons learned

<!-- Last updated: 2026-09-12T12:57:31.156Z -->

## Recurring feedback

<!-- session 2ae04c1d 2026-09-12 -->
- Format validation is strict: lesson extraction requires exact pattern matching - each finding prefixed with `[Section]`, one per line. Deviation causes user correction cycle.

<!-- session 291575a9 2026-09-12 -->
- Output format strictly enforces only these four patterns: [Recurring feedback], [Agent errors], [Documentation gaps], [Known constraints] — no other patterns or mixed formats are valid; partial violations trigger rejection.

<!-- session 5b30e78d 2026-09-12 -->
- When a specific output format is mandated, validate each line against the pattern before submitting — do not mix valid and invalid prefixes in the same response.

<!-- session f4771c99 2026-09-12 -->
- For lesson extraction tasks with strict format requirements (exact bracket syntax), validate output against the format spec before submitting — the assistant should have caught the mismatch proactively.

<!-- session 02d24b3f 2026-09-12 -->
- Assistant failed to follow exact output format requirements - user had to explicitly correct the format specification, indicating stricter adherence to format constraints is needed when they are explicitly stated upfront

<!-- session 38681d04 2026-09-06 -->
- User corrected scope (local→global) and rule coverage (if-only→if+try) multiple times; design should prompt for explicit scope and tag selection before implementation starts.

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

<!-- session 2ae04c1d 2026-09-12 -->
- `/doctor` fork spent multiple round-trips (12:51:43–12:53:29) exploring transcript JSON structure via trial-and-error bash commands to locate `toolDenialKind` entries, suggesting incomplete schema knowledge rather than direct lookup.

<!-- session 2cdeb972 2026-09-12 -->
- Assistant's initial output violated the strict 4-pattern format specification (only [Recurring feedback], [Agent errors], [Documentation gaps], [Known constraints] allowed), requiring user to provide format correction.

<!-- session 402e606c 2026-09-12 -->
- /doctor fork assumed `toolDenialKind` would be at transcript JSON top-level; multiple grep/parse retries (12:53:14–12:53:31) with explicit corrections ("NOT at the top level - it seems to be inside the message") indicate wrong assumption about field nesting.

<!-- session a6541297 2026-09-12 -->
- Assistant failed to consistently apply the required output format ([Recurring feedback], [Agent errors], [Documentation gaps], [Known constraints] prefixes) when extracting lessons — mixed compliant and non-compliant output lines in the same response

<!-- session 28942b57 2026-09-12 -->
- Response truncated mid-sentence when explaining format spec compliance; unable to verify if output actually matched the bracket-tag format requirement or what the complete diagnosis was.
- `/doctor` health-check command invoked but absent from available skills list; agent fork conducted extensive diagnostics across settings, hooks, transcripts, and tool denials without clear decision made or outcome reported back.

<!-- session 3da0bb08 2026-09-12 -->
- Failed to follow explicit format requirements on first attempt — future outputs must validate against format constraints before returning

<!-- session e8e825d8 2026-09-12 -->
- Fork `/doctor` agent made multiple iterative attempts to locate `toolDenialKind` field in telemetry data, first assuming top-level structure, then discovering it's nested inside content blocks—should have read full JSON structure or telemetry schema upfront instead of guessing.

<!-- session 3ce99fde 2026-09-12 -->
- Incomplete delivery on multi-part question: User asked about bundle.ts errors AND dist-bundle deletion. Assistant completed dist-bundle cleanup but left bundle.ts unfixed until user called out "t'as pas résolu le bundle.ts ????" — process all parts of multi-item questions to completion before declaring done.

<!-- session eb1717a3 2026-09-12 -->
- Output format violation - assistant produced output lines that failed to match the four required bracket patterns ([Recurring feedback], [Agent errors], [Documentation gaps], [Known constraints])

<!-- session fcb04678 2026-09-12 -->
- Previous output in this session violated the strict format specification (only 4 specific patterns allowed); required user to provide format correction

<!-- session 83119199 2026-09-12 -->
- Assistant violated the required output format when extracting lessons — output lines that didn't match the specification ([Recurring feedback], [Agent errors], [Documentation gaps], [Known constraints]). User had to explicitly correct the format requirement.

<!-- session b0f07c90 2026-09-12 -->
- Meta-error: when explicitly given a format spec with exact bracket patterns (`[Recurring feedback]`, `[Agent errors]`, etc.), the assistant produced output that didn't match the spec instead of following it precisely.
- Session shows systematic exploration (Glob → Read patterns) but no evidence the assistant explained why it was reading each file or what it was investigating before reading; suggests missing context-building narration.

<!-- session 75465157 2026-09-12 -->
- Previous output violated strict format requirement - assistant produced lines that didn't match the four required bracket patterns ([Recurring feedback], [Agent errors], [Documentation gaps], [Known constraints]) or "NOTHING"

<!-- session 8e697fe7 2026-09-12 -->
- Produced incorrectly formatted lesson-extraction output; required explicit format specification with exact bracket patterns `[Recurring feedback]`, `[Agent errors]`, `[Documentation gaps]`, `[Known constraints]` to correct

<!-- session 5b30e78d 2026-09-12 -->
- Assistant produced lesson-extraction output with invalid prefix patterns (lines didn't match the required `[Recurring feedback]`, `[Agent errors]`, `[Documentation gaps]`, `[Known constraints]` format).

<!-- session f4771c99 2026-09-12 -->
- When corrected on format compliance, the assistant responded with "NOTHING" instead of recognizing the user was pointing out a previous output that didn't match the required [Recurring feedback] / [Agent errors] / [Documentation gaps] / [Known constraints] pattern.

<!-- session 7ed1438c 2026-09-12 -->
- Assistant's previous response violated the required format (incomplete lines, truncated output with "Ag...") and required explicit user correction to re-establish format constraints.

<!-- session 38681d04 2026-09-06 -->
- Agent misunderstood scope and created local rules in poker-grid when user explicitly requested global `cs` tag rules in violations-framework.
- When updating dependencies in poker-grid, agent spent multiple rounds searching for package.json files without finding them—suggests unclear project structure or that violations-rules is consumed via global CLI, not local dependency.
- Fixture test file failed CI self-check: em-dash in `no-emoji.test.ts:149` violated the `no-emoji` rule. Test fixtures must comply with all active violation rules, not just the rule being tested.
- Unity rule fixture had off-by-one line number in `.expected` file (violation on line 2, not line 3), caught only on full test run—suggests fixture line counting needs verification before committing.
- Agent ad34 searched for package.json in multiple directories for poker-grid before confirming it uses local .violations/rules files instead of npm package dependency.
- Agent a883 called deferred tools (mcp__github-wadeck-app__actions_list, get_job_logs) without fetching schemas via ToolSearch first, generating "NOT YET KNOWN" warnings.

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

<!-- session 5de881f2 2026-09-12 -->
- Transcript JSONL `toolDenialKind` field structure location is not intuitive — iterative debugging required to locate nested vs. top-level position; should be documented in transcript format reference

<!-- session eb1717a3 2026-09-12 -->
- Script compilation setup was unclear — new `packages/violations-cli/scripts/tsconfig.json` was created during session without prior reference

<!-- session 38681d04 2026-09-06 -->
- poker-grid's test invocation is `violations test --local`, not generic `npm test`—not documented in CLAUDE.md or easily discoverable.
- poker-grid CLAUDE.md lacks clarity on whether it consumes @wadeck-app/violations-rules as npm dependency or uses local .violations/rules files.

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

<!-- session 2ae04c1d 2026-09-12 -->
- ToolSearch with `select:` prefix fails silently (WARN) when target tool schema is not yet known—schemas must be fetched or pre-loaded before invocation, not discovered on demand.

<!-- session 2cdeb972 2026-09-12 -->
- Tools ToolSearch and mcp__intellij__get_inspections reported as "*** NOT YET KNOWN ***" with warnings in guardrails log—indicates dynamic tool registration/availability may fail silently or with minimal visibility.

<!-- session 5de881f2 2026-09-12 -->
- Windows Git Bash: use `$TEMP` instead of `/tmp` for temp directories; `/tmp` maps to AppData/Local/Temp and may cause issues with path logic

<!-- session a6541297 2026-09-12 -->
- Destructive operations (git rm, rm -rf) require explicit permission bypass through guardrails, routed through request-bypass.js script before execution
- Fork agents are appropriate for extended diagnostic workflows (health checks with /doctor command); the workflow transitioned from file edits to multi-stage diagnostics suggesting troubleshooting context

<!-- session 28942b57 2026-09-12 -->
- Diagnostic sessions may spawn multiple bash rounds investigating ~/.claude state before confirming whether the investigation was necessary or actionable.

<!-- session e8e825d8 2026-09-12 -->
- Project uses custom guardrails (`request-bypass.js`) for permission bypass requests; requires GitHub Packages registry setup in `~/.npmrc` for `@wadeck-app/*` packages; runs on Windows with Git Bash (POSIX paths in /tmp, TEMP directory mapping).

<!-- session 3ce99fde 2026-09-12 -->
- IntelliJ idea MCP unreliable (ConnectionRefused). File-based tsconfig.json solutions (scripts/tsconfig.json with esModuleInterop flag) required as workaround for IDE TypeScript diagnostics on build scripts.

<!-- session eb1717a3 2026-09-12 -->
- Bundled artifacts (dist-bundle/) required explicit `git rm --cached` cleanup in addition to .gitignore updates — .gitignore alone does not untrack already-committed files

<!-- session 83119199 2026-09-12 -->
- Destructive operations (rm -r) trigger guardrails bypass requests; the system enforces safety on dangerous file operations before allowing them.

<!-- session 75465157 2026-09-12 -->
- Output for session-chunk analysis must be ONLY the four specified bracket patterns (one per line) or exactly "NOTHING" - no variations, no extra text, no partial patterns accepted

<!-- session 7ed1438c 2026-09-12 -->
- Format validation must be strict - only the four specified patterns are valid; partial/malformed output triggers user correction cycles.

<!-- session 38681d04 2026-09-06 -->
- When implementing rule variations (inline-body, inline-no-braces, Allman brace, try variants), enumerate all concrete style cases in fixtures upfront to avoid mid-stream scope creep.

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
