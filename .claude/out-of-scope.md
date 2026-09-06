# Out of Scope — violations-framework

- Full scope replacement via `$scope` — explicitly removed to prevent activation blind spots.
- Walking the file tree inside rules — filtering is the runner's responsibility; rules receive a pre-filtered list.
- Type-checking consumer project code — rules operate on raw file content; the TypeScript compiler only type-checks local rule files.
- Linting or formatting (Prettier/ESLint integration) — violation checking only, not a linter runner.
- IDE integration or editor plugins.
- Fix/auto-correct mode — violations are reported only; remediation is manual.
- Rule discovery across multiple workspaces simultaneously — each `violations check` run targets a single project root.
- `violations-meta/no-legacy-violations-folder` self-application within this repo — suppressed intentionally; the repo hosts migration tooling and `scripts/violations/` is intentionally absent here.
