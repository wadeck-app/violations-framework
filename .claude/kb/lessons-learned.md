# Lessons learned

### Tests and dev builds must never run `npm install -g` for real

**Problem:** An integration test ran `cli update` from a repo-built bundle against the real config dir and real global npm; the install was killed halfway and the global CLI was uninstalled (incident 2026-10-24).
**Fix:** Spawn CLIs in tests with a temp config dir, home, npm prefix/cache/config and an unreachable registry (`isolatedEnv` in `cli.integration.test.ts`); gate auto-update on `isReleaseVersion` (`@wadeck-app/shared-cli/ReleaseVersion`) so only CI-stamped CalVer releases update.
**Context:** A test passing because "the updater file is absent in dist/" is luck, not protection: assert on the explicit refusal message. A dev bundle's version (`0.1.0`, local HHMMSS) must never look like an older release.

### Stale compiled tests keep running after the source is deleted

**Problem:** After deleting `src/devBuildGuard.test.ts`, `npm test` still ran it from `dist/devBuildGuard.test.js` (test count unchanged).
**Fix:** Move the stale `dist/<name>*` files away after deleting a source file, then re-run and check the count dropped.
**Context:** `tsc` never removes outputs of deleted sources.
