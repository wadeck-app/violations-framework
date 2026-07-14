import { editorPrefixGuard, unitTestPrefixGuard } from './prefix-guard.js'
import { runFixtureSuite } from '../test-utils/fixture-runner.js'

runFixtureSuite(editorPrefixGuard, import.meta.url, 'editor-prefix-guard')
runFixtureSuite(unitTestPrefixGuard, import.meta.url, 'unit-test-prefix-guard')
