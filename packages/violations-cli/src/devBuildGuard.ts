// Standalone on purpose: imported by the updater entry, which must not pull violations runtime modules.
//
// A release published to GitHub Packages is stamped by CI (ci/scripts/compute-version.sh) as
// YYYY.MM.DD-BBB-xxxxxxxx: zero-padded build number (3+ digits) and an 8-char lowercase hex hash.
// Anything else (0.1.0, 0.0.0, the local bundler's YYYY.MM.DD-HHMMSS-count-HASH fallback) is a
// repo-built dev bundle. Strict on purpose: a false "release" lets a dev build run `npm install -g`,
// a false "dev" only makes an update refuse loudly.
const CALVER_RE = /^\d{4}\.(0[1-9]|1[0-2])\.(0[1-9]|[12]\d|3[01])-\d{3,}-[0-9a-f]{8}$/

export function isReleaseVersion(version: string | undefined | null): boolean {
	return typeof version === 'string' && CALVER_RE.test(version)
}

/**
 * Printed when a dev build is asked to update. Such a build must never touch the global install:
 * an interrupted `npm install -g` leaves the CLI uninstalled (incident 2026-10-24).
 */
export function devBuildRefusalMessage(version: string): string {
	return `dev build ${version}: refusing to update the global install of violations; ` +
		'only versions installed from GitHub Packages (CalVer YYYY.MM.DD-BBB-hash) auto-update. ' +
		'Use the installed binary instead: violations cli update'
}
