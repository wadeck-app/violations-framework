# Product Vision — violations-framework

violations-framework centralises project-quality rules that would otherwise diverge across TypeScript, React, C#, and Unity projects — a single source of truth for non-linter, domain-specific conventions that codify decisions already made by the project owner.

**Current coverage:** TypeScript, React/TSX, Tailwind CSS, C#, Unity/Mono, CLI conventions, violations-meta (rules about the violations system itself).

## Planned work

- Phase 4: per-rule sub-path imports (`@wadeck-app/violations-rules/rules/<id>`) for lighter consumers.
- `runCli(argv, deps)` injectable export for hermetic CLI testing.
- `preversion` guard in `package.json` to block manual version bumps outside CI.
- `clean` script in `package.json`.

## Scope boundary

violations-framework is a personal/mono-owner toolchain, not a general-purpose open-source linting framework. Rule additions are driven by observed patterns across owned workspaces only.
