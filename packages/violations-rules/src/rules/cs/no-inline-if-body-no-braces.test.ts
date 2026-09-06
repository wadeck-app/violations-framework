import { rule } from './no-inline-if-body-no-braces.js'
import { runFixtureSuite } from '../test-utils/fixture-runner.js'

runFixtureSuite(rule, import.meta.url, 'no-inline-if-body-no-braces')
