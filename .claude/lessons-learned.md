# Lessons learned

<!-- Last updated: 2026-08-22T15:15:08.923Z -->

## Recurring feedback

<!-- session 98b70e86 2026-08-22 -->
- User working cross-project (analyzing poker-grid from violations-framework context) — the find-project skill correctly located the project, but subsequent session-history retrieval forced the agent into exploratory bash/parsing rather than a direct lookup by project path.

<!-- session 33cff5dd 2026-08-21 -->
- User explicitly rejected explicit tag-based activation for `no-rule-without-test` — demanded implicit/always-active for any project with local rules. Rule discovery should be automatic, not require `violations-meta` tag in config. This is a strong UX preference: "no silence, no required manual setup for obvious things."

<!-- session d3bfe61c 2026-08-21 -->
- When dealing with system-level behavior (process structure, launch modes), investigate the actual implementation BEFORE making changes. Do not skip groundwork — ask about or explore implementation details proactively when first encountering such tasks.

<!-- session cc97e40c 2026-08-20 -->
- Previous CI analysis (Aug 19) was "too confident" with insufficient diagnostics — next time, prioritize adding `go env`, version logging, and artifact inspection to feedback loops so debugging doesn't restart from scratch
- When saving documentation for multi-project work, write to the target project's `.claude/docs/` folder, not to violation-framework's memory system — project context matters even when you're physically in another directory

## Agent errors

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

<!-- session 96d9b19f 2026-08-22 -->
- User's intent was global CLI installation for multi-project agent access, but initial response covered only CI publishing. The "global install so all agents can use it" requirement should be in the violations skill or setup docs to surface it earlier.

<!-- session 33cff5dd 2026-08-21 -->
- New `alwaysActive?: boolean` field added to Rule type but not documented — no explanation of what it does, when to use it, or how it interacts with tag-based activation. The `no-rule-without-test` rule itself needs docs about its trigger conditions and purpose.

<!-- session cc97e40c 2026-08-20 -->
- When Go version mismatches occur between `go-version-file` (reads directive) and explicit `go-version:` in workflows, CI produces different binaries but logs nothing — added diagnostic output in build-tray-binary.yml to expose actual GOVERSION/GOTOOLCHAIN/GOROOT on next run

## Known constraints

<!-- session 98b70e86 2026-08-22 -->
- Skills `violations` and `find-project` marked as `*** NOT YET KNOWN ***` when invoked — skill discovery or loading may be blocking or incomplete; these appear to be expected/functional skills but failed resolution on first call.

<!-- session 96d9b19f 2026-08-22 -->
- Custom skills marked "NOT YET KNOWN" in logs — when unavailable, fall back to Bash but flag it to the user rather than silently switching strategies.

<!-- session 33cff5dd 2026-08-21 -->
- Rule activation precedent is tag-based (`projectTags` membership). The `alwaysActive` override bypasses this; future rule authors need to know this exception exists and when to use it.

<!-- session cc97e40c 2026-08-20 -->
- User's GitHub artifact storage is permanently full — cannot recommend GitHub artifacts as a solution; must use git-based verification (commit SHAs, git log staleness) instead
