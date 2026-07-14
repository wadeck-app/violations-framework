import { rule } from './no-missing-unity-api.js'
import { runFixtureSuite } from '../test-utils/fixture-runner.js'

runFixtureSuite(rule, import.meta.url, 'no-missing-unity-api')
