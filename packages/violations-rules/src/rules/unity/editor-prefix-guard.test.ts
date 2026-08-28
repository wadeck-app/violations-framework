import { rule } from './editor-prefix-guard.js'
import { runFixtureSuite } from '../test-utils/fixture-runner.js'

runFixtureSuite(rule, import.meta.url, 'editor-prefix-guard')
