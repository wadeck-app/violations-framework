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
