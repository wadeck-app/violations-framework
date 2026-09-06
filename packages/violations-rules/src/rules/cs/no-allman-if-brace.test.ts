import { rule } from './no-allman-if-brace.js'
import { runFixtureSuite } from '../test-utils/fixture-runner.js'

runFixtureSuite(rule, import.meta.url, 'no-allman-if-brace')
