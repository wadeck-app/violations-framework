import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { isReleaseVersion, devBuildRefusalMessage } from './devBuildGuard.js'

describe('isReleaseVersion', () => {
	it('accepts the CI-stamped GitHub Packages format', () => {
		assert.equal(isReleaseVersion('2026.10.24-143-a4606f23'), true)
		assert.equal(isReleaseVersion('2026.08.23-009-0123abcd'), true)
	})

	it('rejects repo-built dev versions', () => {
		// package.json fallback, unset constant, local bundler HHMMSS fallback (with and without git)
		for (const v of ['0.1.0', '0.0.0', '0.0.0-dev', '2026.10.25-143012-512-a1b2c3d4', '2026.10.25-143012-0-DEV']) {
			assert.equal(isReleaseVersion(v), false, v)
		}
	})

	it('rejects empty and non-string values', () => {
		assert.equal(isReleaseVersion(''), false)
		assert.equal(isReleaseVersion(undefined), false)
		assert.equal(isReleaseVersion(null), false)
	})

	it('refusal message names the version and the actionable alternative', () => {
		const msg = devBuildRefusalMessage('0.1.0')
		assert.ok(msg.includes('0.1.0') && msg.includes('violations cli update'), msg)
	})
})
