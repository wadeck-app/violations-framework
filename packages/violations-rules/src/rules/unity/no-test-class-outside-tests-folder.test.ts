import { rule } from './no-test-class-outside-tests-folder.js'
import { runFixtureSuite } from '../test-utils/fixture-runner.js'

runFixtureSuite(rule, import.meta.url, 'no-test-class-outside-tests-folder')
