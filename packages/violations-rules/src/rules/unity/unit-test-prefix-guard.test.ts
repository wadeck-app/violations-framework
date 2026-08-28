import { rule } from './unit-test-prefix-guard.js'
import { runFixtureSuite } from '../test-utils/fixture-runner.js'

runFixtureSuite(rule, import.meta.url, 'unit-test-prefix-guard')
