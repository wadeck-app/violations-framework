import { rule } from './no-inline-try-body.js'
import { runFixtureSuite } from '../test-utils/fixture-runner.js'

runFixtureSuite(rule, import.meta.url, 'no-inline-try-body')
