import { rule } from './no-find-object-of-type.js'
import { runFixtureSuite } from '../test-utils/fixture-runner.js'

runFixtureSuite(rule, import.meta.url, 'no-find-object-of-type')
