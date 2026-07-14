# violations-framework

A two-package npm framework that centralises generic code-quality rules shared across TypeScript, React, and C# projects. Replaces copy-pasted `scripts/violations/` folders with versioned, published packages. Generic rules live in `@wadeck/violations-rules`; `@wadeck/violations-cli` provides the `violations` binary and compiles local rules on demand.

## Installation

Add the private registry to your project `.npmrc`

```
registry=https://api.backup.wadeck.ch/npm
```

Then install both packages:

```sh
npm install @wadeck/violations-rules @wadeck/violations-cli
```

## npm Registry

Packages are hosted on **GitLab Packages** — source code remains on GitHub.

| Item | Value |
|------|-------|
| Registry URL | `https://gitlab.com/api/v4/packages/npm/` |
| GitLab project (namespace only) | `https://gitlab.com/wadeck/npm-registry` |
| Scope | `@wadeck` |
| Packages published | `@wadeck/violations-rules`, `@wadeck/violations-cli` |
| Install token | GitLab deploy token with `read_package_registry` scope |
| Publish token | GitLab deploy token with `write_package_registry` scope |

### Local ~/.npmrc setup

```
@wadeck:registry=https://gitlab.com/api/v4/packages/npm/
//gitlab.com/api/v4/packages/npm/:_authToken=<read-token>
auth-type=legacy
```

### CI secrets (GitHub Actions)

| Repo | Secret | Token type |
|------|--------|------------|
| `Wadeck/violations-framework` | `GITLAB_NPM_WRITE_TOKEN` | write deploy token |

Publishing happens automatically on every push to `main` via `.github/workflows/publish.yml`.

## Usage

```sh
violations check           # run all active rules, exit with violation count
violations check --staged  # restrict to staged files only
violations test            # run unit tests for all rules
violations test --local    # only .violations/rules/*.test.*
```

Rules are configured in `.violations/config.ts` at the project root. See `.claude/specs/` for full documentation including the tag system, per-rule config, and local rule scaffolding.

## Versioning

Packages are versioned as `1.0.YYYYMMDD-HHMMSS-BUILD-SHA` (e.g. `1.0.20260712-195044-142-a3f2b1c4`), published on every push to `main`.

Why this format:
- `1.0` stays free for real API breaking changes - `^1.0.0` in consumers works forever
- `YYYYMMDD-HHMMSS` ensures correct semver sort for multiple releases per day (`195044 < 195320`)
- `BUILD` (git commit count) is monotone and acts as tiebreaker
- Avoid `2026.7.12` as major.minor.patch - `^2026.x` would break every January when the year rolls over
