import { rule } from './no-raw-tostring-number.js'
import { runFixtureSuite } from '../test-utils/fixture-runner.js'

runFixtureSuite(rule, import.meta.url, 'no-raw-tostring-number')
