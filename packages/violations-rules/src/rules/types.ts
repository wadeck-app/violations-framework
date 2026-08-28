// Re-export types from package root for use in nested rule files.
// Rule files sit at src/rules/<tag>/<rule>.ts and would otherwise need
// deep relative imports (../../types.js). Import from ../types.js instead.
export type {
  Severity,
  Violation,
  Rule,
  RuleOverride,
  ViolationsConfig,
  RuleResult,
  SuppressDirective,
  CacheManifest,
} from '../types.js'
