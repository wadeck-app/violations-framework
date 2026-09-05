# violations-framework

Two npm packages that centralise code-quality violation rules across TypeScript, React, and C# projects.

| Package | Role |
|---------|------|
| `@wadeck-app/violations-rules` | Rule definitions and TypeScript types |
| `@wadeck-app/violations-cli` | `violations` binary, runner, and local rule compiler |

## Install

Add to `~/.npmrc`:

```
@wadeck-app:registry=https://npm.pkg.github.com/
//npm.pkg.github.com/:_authToken=<GitHub PAT with read:packages scope>
```

```sh
npm install @wadeck-app/violations-rules @wadeck-app/violations-cli
```

## Usage

```
violations <command> [options]
```

| Command | Description |
|---------|-------------|
| `check [--staged] [--files a,b,c]` | Run all active rules; exit code = violation count |
| `test [--local] [--rule <id>]` | Run rule unit tests |
| `rules list [--tag <tag>]` | List available rules |
| `rules info <id>` | Show rule details |
| `rules create <name> --lang ts\|js` | Scaffold a new local rule |
| `config validate` | Validate `.violations/config.ts` |
| `cache clear` | Clear the local rule compilation cache |
| `cli self-check` | Validate installation |
| `cli update` | Apply a pending update immediately |

Rules are configured in `.violations/config.ts` at the project root.

## Configuration

Config dir: `~/.config/violations/` (override: `VIOLATIONS_CONFIG_DIR` env)

## Update

Auto-updates in background on every invocation. Manual: `violations cli update`

## Versioning

Version format: `1.0.YYYYMMDD-HHMMSS-BUILD-SHA` - published on every push to `main` via `.github/workflows/publish.yml` using the built-in `GITHUB_TOKEN`.
