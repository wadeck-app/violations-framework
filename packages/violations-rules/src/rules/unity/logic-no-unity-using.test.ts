import { rule } from './logic-no-unity-using.js'
import { runFixtureSuite } from '../test-utils/fixture-runner.js'

// Fixtures use subdirectories (logic/, ui/) to simulate path-based filtering.
// Files under logic/ will have 'logic' in their path, triggering the rule.
runFixtureSuite(rule, import.meta.url, 'logic-no-unity-using')
