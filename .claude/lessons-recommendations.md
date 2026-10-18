# Recommendations

<!-- consolidated 2026-08-21 -->
- [ ] **Process**: When adding a new rule to `packages/violations-rules/src/rules/index.ts`, batch all related changes (imports, exports, `allRules` array entries) into a single Edit call rather than separate sequential calls.

<!-- consolidated 2026-08-21 -->
The existing recommendations file already captures the only actionable item from the lessons learned. No new items to add.

NOTHING

<!-- consolidated 2026-09-05 -->
### Documentation

- [ ] Document `alwaysActive?: boolean` in the Rule type (types.ts) and in `guiding-principles.md`: what it does, when to use it, and how it bypasses tag-based activation — reference `no-rule-without-test` as the canonical example.
- [ ] Add a section in `guiding-principles.md` or `compiler.ts` header describing Windows EPERM behavior during concurrent TypeScript compilation and the requirement to serialize `compileIfNeeded` calls per manifest (not use `Promise.all`).
- [ ] Document `violations test --local` exit-code contract and output-stream behavior (stdout vs stderr, buffering) in the CLI docs or a code comment at the relevant entry point.
- [ ] Add a "global install" note to the violations skill or setup docs explaining how to install the CLI globally so cross-project agents can invoke it without per-project resolution.

### Process

- [ ] When fixing a bug, verify the specific new code path is exercised by a test — not just that existing tests still pass — before declaring the fix done.
- [ ] After pushing to CI, invoke the `poll-ci` skill instead of writing manual sleep/polling loops.
- [ ] When custom skills show as unavailable ("NOT YET KNOWN"), flag it explicitly to the user and fall back to Bash rather than silently switching strategies.
- [ ] Before making changes to system-level behavior (process topology, launch modes, IPC), read the actual startup/implementation code first to confirm assumptions about structure.
- [ ] For multi-part permission requests that belong together (e.g. git-commit + git-push), combine them in a single bypass call.

### Code comments

- [ ] Add a comment above the `compileIfNeeded` serialization logic in `compiler.ts` explaining the Windows EPERM root cause (concurrent writes to the same manifest file).
- [ ] Add a comment where `TestsStream` events are consumed explaining that it emits objects (not strings) and cannot be piped directly to stdout.

### Configuration

- [ ] Add an explicit warning to the `violations` skill: never use the `!` prefix for violations commands — always invoke via the Bash tool directly, otherwise it causes permission prompts and blocks execution flow.

<!-- consolidated 2026-09-27 -->
Looking at the lessons learned to extract actionable recommendations.

## Documentation

- [ ] Document transcript JSONL format including toolDenialKind field location and nesting structure in reference docs
- [ ] Add violations rule design philosophy section to CLAUDE.md or guiding-principles.md explaining suppress-in-code vs exempt-in-rule tradeoffs
- [ ] Document fixture directory structure pattern (fixtures/<rule-id>/{clean,violation}.*) for local rule tests in guiding-principles.md
- [ ] Document Rule type's `alwaysActive?: boolean` field in types.ts: what it does, when to use it, how it interacts with tag-based activation
- [ ] Add section on when/how to use ToolSearch to fetch deferred MCP tool schemas before first invocation
- [ ] Document Windows file-locking behavior during concurrent TypeScript compilation and serialization requirements in compiler.ts or CLAUDE.md

## Process

- [ ] When adding new ts/* rules, always validate with local build `node packages/violations-cli/dist/cli.js check` before committing (not global `violations check`)
- [ ] For CI status monitoring, always use poll-ci skill or ScheduleWakeup instead of sleep-based polling loops
- [ ] Load deferred tool and skill schemas via ToolSearch before first invocation to avoid "NOT YET KNOWN" retry cycles
- [ ] When testing fixes, verify specific new code paths are exercised (not just that existing tests pass) before claiming success
- [ ] Always verify sub-agent results directly (read files, test live, take screenshots) before reporting completion to user
- [ ] Read full JSON structure or schema documentation upfront instead of iterative trial-and-error parsing
- [ ] Process all parts of multi-item questions to completion before declaring done

## Code comments

- [ ] Add warning comment in violations skill about never using `!` prefix for violations commands

## Configuration

- [ ] Add diagnostic output for Go version mismatches in build-tray-binary.yml (log GOVERSION/GOTOOLCHAIN/GOROOT)

<!-- consolidated 2026-10-11 -->
- [ ] Document, in CLAUDE.md or an agent-reference doc, that deferred MCP/skill tools (e.g. `mcp__github-wadeck*__*`, `poll-ci`, `code-review`) must be loaded via `ToolSearch` (or the `Skill` tool) before first invocation — calling them cold produces silent "NOT YET KNOWN" failures that trigger wasteful sleep-based polling fallbacks.
- [ ] Document that the IntelliJ MCP server is frequently unavailable (ConnectionRefused) in this environment — check the system-reminder connection status before attempting any `mcp__intellij__*` tool call.
- [ ] Document the exact test invocation and test-file locations per package in this monorepo (e.g. `node packages/violations-cli/dist/cli.js check`, `npm test` scope, where CLI/runner tests live) so agents stop re-discovering this via repeated grep/ls.
- [ ] Document the local-rule fixture directory contract (`fixtures/<rule-id>/{clean,violation}.*`, `.expected` line numbers) and the requirement that fixture file contents themselves must pass all active violation rules (e.g. no-emoji, no-em-dash).
- [ ] Document the project's "no rule exemptions" philosophy explicitly: rules fire unconditionally on matching patterns; exceptions are handled via explicit suppress comments in code, never via conditional logic added to the rule itself.
- [ ] Document the `alwaysActive` Rule field: what it does, when to use it (bypassing tag-based `projectTags` activation), and that this is an intentional exception agents should know about before adding new rules.
- [ ] Document Windows-specific compiler constraints already discovered: per-manifest serialization lock needed to avoid EPERM during concurrent TypeScript compilation of cached rules, and that `import.meta.dirname` must be rewritten to the source directory (not cache dir) for fixture resolution.
