import { rule } from './const-field-pascal-case.js'
import { runFixtureSuite } from '../test-utils/fixture-runner.js'

runFixtureSuite(rule, import.meta.url, 'const-field-pascal-case')
