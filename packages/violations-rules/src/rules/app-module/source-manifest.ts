// Dependency-free validator of the source manifest.json an app-module author writes at the module root.
// Hand-written port of SourceManifestSchema (app-core: packages/server/src/manifest.ts, zod), because
// this package has no runtime dependencies and must not shell out to app-core-cli. Keep in sync with it.
// The source manifest holds only id, extensionPoints, dslLib.shared, requires, expose, lifecycle and showInNav:
// version, backendEntryPath and dslLib.entry/css are written by `package` into dist-module/manifest.json.

// Same pattern as app-core's MODULE_ID_PATTERN and SLOT_LOCAL_PATTERN.
const ID_PATTERN = /^[A-Za-z0-9][A-Za-z0-9_-]*$/
const ID_RULE = 'start with a letter or digit and contain only letters, digits, "_" and "-"'
const SHELL_SLOTS = ['dashboard', 'nav', 'route', 'navbar', 'overlay']
const PAGE_PATH_PATTERN = /^(?:\/|(?:\/(?:[A-Za-z0-9_-]+|:[A-Za-z_][A-Za-z0-9_]*))+)$/

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

function isNonEmptyString(value: unknown): value is string {
  return typeof value === 'string' && value.length > 0
}

// Local part of a module's side menu slot ("<moduleId>:nav"). Same as app-core's MENU_SLOT_LOCAL.
const MENU_SLOT_LOCAL = 'nav'

// The module whose side menu the slot is ("<providerId>:nav"), else undefined. Same as app-core's menuSlotProvider.
function menuSlotProvider(slot: string): string | undefined {
  const parts = slot.split(':')
  return parts.length === 2 && parts[1] === MENU_SLOT_LOCAL && ID_PATTERN.test(parts[0]) ? parts[0] : undefined
}

function slotProblem(slot: string): string | undefined {
  if (SHELL_SLOTS.includes(slot)) {
    return undefined
  }
  const parts = slot.split(':')
  if (parts.length === 2 && ID_PATTERN.test(parts[0]) && ID_PATTERN.test(parts[1])) {
    return undefined
  }
  return `slot "${slot}" is not a shell slot (${SHELL_SLOTS.join(', ')}) and not of the form "<providerId>:<slot>"`
}

function rejectUnknownKeys(value: Record<string, unknown>, allowed: string[], path: string, issues: string[]): void {
  for (const key of Object.keys(value)) {
    if (!allowed.includes(key)) {
      issues.push(`${path}: unrecognized key "${key}"`)
    }
  }
}

function checkStringOrUndefined(value: unknown, path: string, issues: string[]): void {
  if (value !== undefined && !isNonEmptyString(value)) {
    issues.push(`${path}: must be a non-empty string`)
  }
}

function checkExtensionPoint(ep: unknown, path: string, issues: string[]): SourceManifest['extensionPoints'][number] | undefined {
  if (!isObject(ep)) {
    issues.push(`${path}: must be an object`)
    return undefined
  }
  const before = issues.length
  if (!isNonEmptyString(ep.kind)) {
    issues.push(`${path}.kind: must be a non-empty string`)
  }
  if (!isNonEmptyString(ep.slot)) {
    issues.push(`${path}.slot: must be a non-empty string`)
  } else {
    const problem = slotProblem(ep.slot)
    if (problem !== undefined) {
      issues.push(`${path}.slot: ${problem}`)
    }
  }
  if (ep.label !== undefined && typeof ep.label !== 'string') {
    issues.push(`${path}.label: must be a string`)
  }
  if (ep.order !== undefined && typeof ep.order !== 'number') {
    issues.push(`${path}.order: must be a number`)
  }
  if (ep.path !== undefined) {
    if (typeof ep.path !== 'string' || !PAGE_PATH_PATTERN.test(ep.path)) {
      issues.push(`${path}.path: must look like "/jobs/:id": segments of letters, digits, "_" or "-", or ":param"`)
    } else if (ep.kind !== 'page') {
      issues.push(`${path}.path: path is only valid on extension points of kind "page"`)
    }
  }
  // A contribution to `<providerId>:nav` is an entry in that module's side menu: it needs what a menu entry needs.
  const provider = isNonEmptyString(ep.slot) ? menuSlotProvider(ep.slot) : undefined
  if (provider !== undefined) {
    const what = `an entry in the side menu of "${provider}"`
    if (ep.kind !== 'page') {
      issues.push(`${path}.kind: a contribution to "${ep.slot}" is ${what}, so its kind must be "page" (got "${String(ep.kind)}")`)
    }
    if (typeof ep.label !== 'string' || ep.label.trim() === '') {
      issues.push(`${path}.label: a contribution to "${ep.slot}" is ${what}: add a "label", it is the text of the entry`)
    }
    if (ep.path === undefined) {
      issues.push(`${path}.path: a contribution to "${ep.slot}" is ${what}: add a "path" (for example "/chart"), it is the page's address under /modules/<your id>`)
    } else if (typeof ep.path === 'string' && ep.path.includes(':')) {
      issues.push(`${path}.path: a contribution to "${ep.slot}" is ${what}: its path "${ep.path}" has a ":param" segment, but a menu entry needs a fixed address`)
    }
  }
  const view = ep.view
  if (!isObject(view) || (view.type !== 'inline' && view.type !== 'path')) {
    issues.push(`${path}.view.type: must be "inline" or "path"`)
  }
  if (issues.length > before) {
    return undefined
  }
  return { kind: ep.kind as string, slot: ep.slot as string, view: view as SourceManifestView }
}

function checkRequires(requires: unknown, issues: string[]): void {
  if (!isObject(requires)) {
    issues.push('requires: must be an object of module id -> semver range')
    return
  }
  for (const [id, range] of Object.entries(requires)) {
    if (!ID_PATTERN.test(id)) {
      issues.push(`requires.${id}: module id must ${ID_RULE}`)
    }
    checkStringOrUndefined(range ?? '', `requires.${id}`, issues)
  }
}

function checkExpose(expose: unknown, issues: string[]): void {
  if (!isObject(expose)) {
    issues.push('expose: must be an object')
    return
  }
  rejectUnknownKeys(expose, ['types', 'slots'], 'expose', issues)
  checkStringOrUndefined(expose.types, 'expose.types', issues)
  if (expose.slots === undefined) {
    return
  }
  if (!isObject(expose.slots)) {
    issues.push('expose.slots: must be an object')
    return
  }
  for (const [name, slot] of Object.entries(expose.slots)) {
    const path = `expose.slots.${name}`
    if (!ID_PATTERN.test(name)) {
      issues.push(`${path}: slot name must ${ID_RULE} (no ":", the module id is added as the prefix)`)
    }
    if (name === MENU_SLOT_LOCAL) {
      issues.push(`${path}: slot name "${MENU_SLOT_LOCAL}" is reserved: every module's side menu is "<id>:${MENU_SLOT_LOCAL}" and accepts pages from the modules that require it, no declaration needed`)
    }
    if (!isObject(slot)) {
      issues.push(`${path}: must be an object with "accepts"`)
      continue
    }
    rejectUnknownKeys(slot, ['accepts'], path, issues)
    if (!Array.isArray(slot.accepts) || slot.accepts.length === 0 || !slot.accepts.every(isNonEmptyString)) {
      issues.push(`${path}.accepts: must list at least one $type (non-empty strings)`)
    }
  }
}

function checkLifecycle(lifecycle: unknown, issues: string[]): void {
  if (!isObject(lifecycle)) {
    issues.push('lifecycle: must be an object')
    return
  }
  rejectUnknownKeys(lifecycle, ['teardown', 'migrate'], 'lifecycle', issues)
  checkStringOrUndefined(lifecycle.teardown, 'lifecycle.teardown', issues)
  checkStringOrUndefined(lifecycle.migrate, 'lifecycle.migrate', issues)
}

function checkDslLib(dslLib: unknown, issues: string[]): Record<string, string> | undefined {
  if (!isObject(dslLib)) {
    issues.push('dslLib: must be an object')
    return undefined
  }
  rejectUnknownKeys(dslLib, ['shared'], 'dslLib', issues)
  const shared = dslLib.shared ?? {}
  if (!isObject(shared) || !Object.values(shared).every(isNonEmptyString)) {
    issues.push('dslLib.shared: must be an object of package name -> semver range (non-empty strings)')
    return undefined
  }
  return shared as Record<string, string>
}

export function validateSourceManifest(raw: unknown): SourceManifestResult {
  const issues: string[] = []
  if (!isObject(raw)) {
    return { ok: false, issues: ['(root): must be a JSON object'] }
  }
  rejectUnknownKeys(raw, ['id', 'extensionPoints', 'dslLib', 'requires', 'expose', 'lifecycle', 'showInNav'], '(root)', issues)

  // A real boolean on purpose: "false" (string), 0 and null are rejected, like app-core's z.boolean().
  if (raw.showInNav !== undefined && typeof raw.showInNav !== 'boolean') {
    issues.push('showInNav: must be a boolean (true or false), not a string, number or null')
  }

  if (typeof raw.id !== 'string') {
    issues.push('id: required string')
  } else if (!ID_PATTERN.test(raw.id)) {
    issues.push(`id: module id must ${ID_RULE}`)
  }

  const extensionPoints: SourceManifest['extensionPoints'] = []
  if (!Array.isArray(raw.extensionPoints) || raw.extensionPoints.length === 0) {
    issues.push('extensionPoints: must be an array with at least one entry')
  } else {
    raw.extensionPoints.forEach((ep, index) => {
      const checked = checkExtensionPoint(ep, `extensionPoints.${index}`, issues)
      if (checked !== undefined) {
        extensionPoints.push(checked)
      }
    })
  }

  const dslLibShared = raw.dslLib === undefined ? undefined : checkDslLib(raw.dslLib, issues)
  if (raw.requires !== undefined) {
    checkRequires(raw.requires, issues)
  }
  if (raw.expose !== undefined) {
    checkExpose(raw.expose, issues)
  }
  if (raw.lifecycle !== undefined) {
    checkLifecycle(raw.lifecycle, issues)
  }

  if (issues.length > 0) {
    return { ok: false, issues }
  }
  return {
    ok: true,
    manifest: {
      id: raw.id as string,
      extensionPoints,
      ...(dslLibShared === undefined ? {} : { dslLib: { shared: dslLibShared } }),
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
