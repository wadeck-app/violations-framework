// Minimal structural validation of an app-module manifest.json, deliberately
// duplicated here instead of importing @wadeck-app/app-core-sdk's parseManifest -
// violations-rules is a generic framework package and must not depend on an
// app-specific SDK (wrong dependency direction).

export type ExtensionPointView =
  | { type: 'path'; value: string }
  | { type: 'inline'; value: unknown }

export type ExtensionPoint = {
  kind: string
  slot: string
  view: ExtensionPointView
}

export type Manifest = {
  version: string
  backendEntryPath: string
  extensionPoints: ExtensionPoint[]
}

export class ManifestValidationError extends Error {}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

export function parseManifest(raw: unknown): Manifest {
  if (!isRecord(raw)) {
    throw new ManifestValidationError('manifest must be an object')
  }

  if (typeof raw.version !== 'string') {
    throw new ManifestValidationError('version: must be a string')
  }
  if (typeof raw.backendEntryPath !== 'string') {
    throw new ManifestValidationError('backendEntryPath: must be a string')
  }
  if (!Array.isArray(raw.extensionPoints)) {
    throw new ManifestValidationError('extensionPoints: must be an array')
  }

  const extensionPoints = raw.extensionPoints.map((ep, i) => parseExtensionPoint(ep, i))

  return { version: raw.version, backendEntryPath: raw.backendEntryPath, extensionPoints }
}

function parseExtensionPoint(raw: unknown, index: number): ExtensionPoint {
  if (!isRecord(raw)) {
    throw new ManifestValidationError(`extensionPoints[${index}]: must be an object`)
  }

  if (typeof raw.kind !== 'string') {
    throw new ManifestValidationError(`extensionPoints[${index}].kind: must be a string`)
  }
  if (typeof raw.slot !== 'string') {
    throw new ManifestValidationError(`extensionPoints[${index}].slot: must be a string`)
  }

  const view = raw.view
  if (!isRecord(view)) {
    throw new ManifestValidationError(`extensionPoints[${index}].view: must be an object`)
  }
  if (view.type !== 'path' && view.type !== 'inline') {
    throw new ManifestValidationError(`extensionPoints[${index}].view.type: must be "path" or "inline"`)
  }
  if (view.type === 'path' && typeof view.value !== 'string') {
    throw new ManifestValidationError(`extensionPoints[${index}].view.value: must be a string for a "path" view`)
  }

  return { kind: raw.kind, slot: raw.slot, view: view as ExtensionPointView }
}
