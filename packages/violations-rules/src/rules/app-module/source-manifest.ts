import { SourceManifestSchema } from '@wadeck-app/app-core-sdk'

// Validates the source manifest.json an app-module author writes at the module root with app-core's own
// SourceManifestSchema (SDK main entry: imports only zod, never the "/register" subpath, which uses node and fetch).
// There is no hand-written copy of the rules: a new app-core rule reaches this check with the next release of
// this package that takes the new SDK version (the dependency is on the `latest` dist-tag).

export type SourceManifestView = { type: 'inline' | 'path'; value: unknown }

export type SourceManifest = {
  id: string
  extensionPoints: Array<{ kind: string; slot: string; view: SourceManifestView }>
  // Present when the manifest declares dslLib.
  dslLib?: { shared: Record<string, string> }
}

export type SourceManifestResult = { ok: true; manifest: SourceManifest } | { ok: false; issues: string[] }

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

export function validateSourceManifest(raw: unknown): SourceManifestResult {
  const parsed = SourceManifestSchema.safeParse(raw)
  if (!parsed.success) {
    return {
      ok: false,
      issues: parsed.error.issues.map((issue) => `${issue.path.length === 0 ? '(root)' : issue.path.join('.')}: ${issue.message}`),
    }
  }
  const manifest = parsed.data
  return {
    ok: true,
    manifest: {
      id: manifest.id,
      extensionPoints: manifest.extensionPoints.map((ep) => ({ kind: ep.kind, slot: ep.slot, view: ep.view as SourceManifestView })),
      ...(manifest.dslLib === undefined ? {} : { dslLib: { shared: manifest.dslLib.shared ?? {} } }),
    },
  }
}

// What is wrong with a view file's content, or undefined. A view is a YAML/JSON object (with a $type),
// never code. No YAML parser is available here: .json is parsed for real; for YAML only the root
// shape is read (first content line), so a YAML *syntax* error deeper in the file is not detected.
export function viewContentProblem(file: string, text: string): string | undefined {
  if (file.toLowerCase().endsWith('.json')) {
    let parsed: unknown
    try {
      parsed = JSON.parse(text)
    } catch (err) {
      return `is not valid JSON: ${(err as Error).message}. Fix the syntax.`
    }
    return isObject(parsed) ? undefined : 'a view must be a YAML/JSON object (with a $type). Start the file with `$type: <Component>`.'
  }

  const first = text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .find((line) => line !== '' && !line.startsWith('#') && line !== '---' && !line.startsWith('%'))
  // A block mapping starts with `key:` / `"key":`, a flow mapping with `{`.
  const looksLikeMapping = first !== undefined && (first.startsWith('{') || /^(?:"[^"]*"|'[^']*'|[^\s\-[\]{}#&*!|>'"%@`,?][^:]*?)\s*:(?:\s|$)/.test(first))
  return looksLikeMapping ? undefined : 'a view must be a YAML/JSON object (with a $type). Start the file with `$type: <Component>`.'
}
