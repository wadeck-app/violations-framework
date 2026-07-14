import { rule } from './no-async-lambda-into-syncrunner.js'
import { runFixtureSuite } from '../test-utils/fixture-runner.js'

runFixtureSuite(rule, import.meta.url, 'no-async-lambda-into-syncrunner')
