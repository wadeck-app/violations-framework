import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { rule } from './no-arrow-body.js'
import { runFixtureSuiteInline } from '../test-utils/fixture-runner.js'

describe('cs/no-arrow-body', () => {
  it('has severity info', () => {
    assert.equal(rule.defaultSeverity, 'info')
  })

  runFixtureSuiteInline(rule, import.meta.url, 'no-arrow-body')
})
