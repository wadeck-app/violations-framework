import { rule } from './no-new-texture2d.js'
import { runFixtureSuite } from '../test-utils/fixture-runner.js'

runFixtureSuite(rule, import.meta.url, 'no-new-texture2d')
