import { rule } from './no-multiline-comment-before-class.js'
import { runFixtureSuite } from '../test-utils/fixture-runner.js'

runFixtureSuite(rule, import.meta.url, 'no-multiline-comment-before-class')
