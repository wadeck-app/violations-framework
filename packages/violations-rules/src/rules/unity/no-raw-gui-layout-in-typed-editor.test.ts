import { rule } from './no-raw-gui-layout-in-typed-editor.js'
import { runFixtureSuite } from '../test-utils/fixture-runner.js'

runFixtureSuite(rule, import.meta.url, 'no-raw-gui-layout-in-typed-editor')
