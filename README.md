# violations-framework

A two-package npm framework that centralises generic code-quality rules shared across TypeScript, React, and C# projects. Replaces copy-pasted `scripts/violations/` folders with versioned, published packages. Generic rules live in `@wadeck-app/violations-rules`; `@wadeck-app/violations-cli` provides the `violations` binary and compiles local rules on demand.

## Installation

Add GitHub Packages to your project `.npmrc`:

```
@wadeck-app:registry=https://npm.pkg.github.com/
//npm.pkg.github.com/:_authToken=<GitHub PAT with read:packages scope>
```

Then install both packages:

```sh
npm install @wadeck-app/violations-rules @wadeck-app/violations-cli
```

## npm Registry

Packages are hosted on **GitHub Packages** at `https://github.com/wadeck-app/violations-framework`.

| Item | Value |
|------|-------|
| Registry URL | `https://npm.pkg.github.com/` |
| GitHub organisation | `wadeck-app` |
| Scope | `@wadeck-app` |
| Packages published | `@wadeck-app/violations-rules`, `@wadeck-app/violations-cli` |
| Install token | GitHub PAT with `read:packages` scope |
| Publish token | `GITHUB_TOKEN` (automatic in GitHub Actions) |

### Local ~/.npmrc setup

```
@wadeck-app:registry=https://npm.pkg.github.com/
//npm.pkg.github.com/:_authToken=<GitHub PAT with read:packages>
```

### CI secrets (GitHub Actions)

Publishing uses the built-in `GITHUB_TOKEN` - no repository secret needed for publish.

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
