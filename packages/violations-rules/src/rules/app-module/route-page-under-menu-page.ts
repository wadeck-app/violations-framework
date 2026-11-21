import { readFileSync } from 'node:fs'
import type { Rule, Violation } from '../types.js'
import { moduleRootOfRootFile } from './layout.js'

export type Config = Record<never, never>

type PageEntry = { index: number; slot: string; path: string | undefined }

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function segments(path: string): string[] {
  return path.split('/').filter((s) => s !== '')
}

// A route param (":id") matches any value, on either side.
function segmentMatches(menuSegment: string, routeSegment: string): boolean {
  return menuSegment === routeSegment || menuSegment.startsWith(':') || routeSegment.startsWith(':')
}

// Mirrors the shell's isPageCurrent (app-core frontend-shell navModel.ts): the home page "/" is exact and
// highlights only itself; any other menu page highlights its path and every route under it.
function highlights(menuPath: string, routePath: string): boolean {
  const menu = segments(menuPath)
  const route = segments(routePath)
  // Exact: the home menu page is current on "/" only.
  if (menu.length === 0) {
    return route.length === 0
  }
  return menu.length <= route.length && menu.every((segment, i) => segmentMatches(segment, route[i]))
}

// A route page (slot "route") that no menu page highlights leaves the left menu with NO current
// entry while the user is on it. A module with no nav page is out of scope (nothing to highlight).
// Schema errors are left to app-core-sdk/manifest-valid; entries that cannot be read are skipped here.
export const rule: Rule<Config> = {
  id: 'app-module/route-page-under-menu-page',
  tags: 'app-module',
  alwaysActive: true,
  defaultScope: ['**/app-module-*/manifest.json'],
  defaultSeverity: 'error',

  async check(files: string[], _config: Config): Promise<Violation[]> {
    const violations: Violation[] = []

    for (const manifestPath of files) {
      if (moduleRootOfRootFile(manifestPath) === undefined) {
        continue
      }

      let raw: unknown
      try {
        raw = JSON.parse(readFileSync(manifestPath, 'utf-8'))
      } catch {
        continue
      }
      if (!isObject(raw) || !Array.isArray(raw.extensionPoints)) {
        continue
      }

      const pages: PageEntry[] = []
      raw.extensionPoints.forEach((ep, index) => {
        if (isObject(ep) && ep.kind === 'page' && typeof ep.slot === 'string') {
          pages.push({ index, slot: ep.slot, path: typeof ep.path === 'string' ? ep.path : undefined })
        }
      })

      const navPages = pages.filter((p) => p.slot === 'nav')
      if (navPages.length === 0) {
        continue
      }
      // A nav page without a path lives at /modules/<id>/<index> (app-core module contract): it highlights no route.
      const menuPaths = navPages.flatMap((p) => (p.path === undefined ? [] : [p.path]))

      for (const route of pages) {
        // Only slot "route" pages are routed; other slots (<providerId>:<slot>) are not shown as pages.
        if (route.slot !== 'route' || route.path === undefined) {
          continue
        }
        const routePath = route.path
        if (menuPaths.some((menuPath) => highlights(menuPath, routePath))) {
          continue
        }
        // The home "/" can never be under another menu page: the only fix is a nav page that is "/" itself.
        const advice = segments(routePath).length === 0
          ? 'add a nav page with path "/" (the home is exact, so it highlights itself), or make this route a nav page'
          : 'move it under a menu page (e.g. nav /projects, route /projects/:project)'
        violations.push({
          file: manifestPath,
          line: 1,
          message: `extensionPoints[${route.index}] route page ${routePath} highlights no menu entry: ${advice}. The home page "/" highlights only itself.`,
        })
      }
    }

    return violations
  },
}
