# Tags

Tags control which library rules activate automatically for a project.

## How it works

Each rule declares a single `tags` string (e.g. `tags: 'ts'`). A rule activates when its tag appears in `projectTags` in the project's `.violations/config.ts`.

Tag activation uses **AND logic for specificity**: declaring `react` implies `ts` (React projects are TypeScript). Declare only the most-specific tag in your rule - do not stack `tags: ['ts', 'react']`.

## Available tags

| Tag | Activates rules for |
|---|---|
| `shared` | Language-agnostic rules (French text, em-dash, emoji, partial-impl flags…) |
| `ts` | TypeScript source files |
| `react` | React/TSX components (implies `ts`) |
| `tailwind` | Tailwind CSS usage |
| `cs` | C# source files |
| `unity` | Unity/Mono C# projects (implies `cs`) |
| `cli` | Node.js CLI tools (spawn, publish config, daemon patterns) |
| `dsl` | DSL-app architecture projects |
| `violations-meta` | Rules about the violations system itself (rule files, suppress comments) |

## Example config

```ts
export default {
  projectTags: ['ts', 'shared', 'react', 'tailwind'],
  // ...
} satisfies ViolationsConfig
```

## Overriding a tag-activated rule

Any rule activated by a tag can be overridden in `config.rules`:

```ts
rules: {
  'ts/no-barrel-index': { $severity: 'warning' },   // downgrade
  'react/no-raw-button': false,                       // disable entirely
  'shared/no-emoji': { $exclude: ['**/docs/**'] },   // narrow scope
}
```
