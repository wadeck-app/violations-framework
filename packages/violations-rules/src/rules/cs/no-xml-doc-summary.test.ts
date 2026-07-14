import { rule } from './no-xml-doc-summary.js'
import { runFixtureSuite } from '../test-utils/fixture-runner.js'

runFixtureSuite(rule, import.meta.url, 'no-xml-doc-summary')
