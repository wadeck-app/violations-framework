// Minimal, lenient reading of the source manifest.json for the app-module layout rules. It does NOT validate
// the manifest schema: that belongs to app-core, which ships the rule `app-core-sdk/manifest-valid` inside
// @wadeck-app/app-core-sdk/violations (always the schema version the module is built against). Reading
// leniently means a malformed entry is skipped here and reported there, so a problem is never reported twice.

export type SourceManifestView = { index: number; type: string; value: unknown }

export type ManifestShape = {
  // Extension points that carry a view object with a string type; `index` is the position in extensionPoints.
  views: SourceManifestView[]
  // True when the manifest declares dslLib.
  hasDslLib: boolean
}

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

// The parts of the manifest the layout rules need, or undefined when the root is not a JSON object.
export function readManifestShape(raw: unknown): ManifestShape | undefined {
  if (!isObject(raw)) {
    return undefined
  }
  const views: SourceManifestView[] = []
  if (Array.isArray(raw.extensionPoints)) {
    raw.extensionPoints.forEach((ep, index) => {
      if (isObject(ep) && isObject(ep.view) && typeof ep.view.type === 'string') {
        views.push({ index, type: ep.view.type, value: ep.view.value })
      }
    })
  }
  return { views, hasDslLib: raw.dslLib !== undefined }
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
