import { rule } from './no-redundant-fqn.js'
import { runFixtureSuite } from '../test-utils/fixture-runner.js'

runFixtureSuite(rule, import.meta.url, 'no-redundant-fqn')
