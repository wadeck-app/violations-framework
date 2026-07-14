import { rule } from './listener-register-symmetry.js'
import { runFixtureSuite } from '../test-utils/fixture-runner.js'

runFixtureSuite(rule, import.meta.url, 'listener-register-symmetry')
