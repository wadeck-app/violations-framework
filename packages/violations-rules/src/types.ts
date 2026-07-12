export type Severity = 'error' | 'warning' | 'info'

export type Violation = {
  // absolute path
  file: string
  // 1-based, matches editor gutter numbers
  line: number
  message: string
}

export type Rule<Config extends Record<string, unknown> = Record<never, never>> = {
  // namespaced, e.g. 'ts/no-export-star'
  id: string
  // single tag - most-specific only (e.g. 'react' not 'ts' for React rules)
  tags: string
  // glob patterns relative to project root
  defaultScope: string[]
  defaultSeverity: Severity
  check(files: string[], config: Config): Promise<Violation[]>
}

export type RuleOverride<Config extends Record<string, unknown> = Record<never, never>> = {
  // false = disable rule entirely
  $severity?: Severity | false
  // adds to defaultScope, does not replace
  $scopeAdd?: string[]
  // glob exceptions applied after scope resolution
  $exclude?: string[]
} & Partial<Config>

// Internal registry -- maps every framework rule ID to its exported Config type.
// Updated when a rule is added.
type RuleConfigMap = {
  'shared/no-em-dash':                          Record<never, never>
  'shared/no-french':                           { extraWords?: string[] }
  'shared/partial-impl-flag':                   Record<never, never>
  'shared/readme-system-length':                { maxLines?: number }
  'shared/no-dead-suppress':                    { activeRuleIds: string[] }
  'ts/no-export-star':                          Record<never, never>
  'ts/no-err-message-direct':                   Record<never, never>
  'ts/no-union-with-string':                    Record<never, never>
  'ts/no-switch-default-break':                 Record<never, never>
  'ts/no-locale-date':                          Record<never, never>
  'ts/no-cross-package-relative':               Record<never, never>
  'ts/no-barrel-index':                         Record<never, never>
  'ts/no-single-file-folder':                   Record<never, never>
  'ts/no-inline-subcomponent':                  Record<never, never>
  'ts/no-unsafe-type-cast':                     Record<never, never>
  'react/no-raw-button':                        Record<never, never>
  'react/no-raw-input':                         Record<never, never>
  'react/no-inline-svg':                        Record<never, never>
  'react/no-context-in-renderer':               { restrictToPackages?: string[] }
  'tailwind/no-raw-color-class':                Record<never, never>
  'tailwind/no-inline-classname':               { maxChars?: number }
  'tailwind/no-button-classname-style-override': Record<never, never>
  'cs/no-namespace':                            Record<never, never>
  'cs/no-redundant-fqn':                        Record<never, never>
  'cs/no-xml-doc-summary':                      Record<never, never>
  'cs/const-field-pascal-case':                 Record<never, never>
  'cs/no-raw-exception':                        { bannedTypes?: string[] }
  'cs/no-linq-import':                          Record<never, never>
  'cs/no-task-wait':                            Record<never, never>
  'cs/no-arrow-body':                           Record<never, never>
  'cs/no-multiline-comment-before-class':       Record<never, never>
  'cs/test-file-location':                      Record<never, never>
  'unity/logic-no-unity-using':                 Record<never, never>
  'unity/no-missing-unity-api':                 Record<never, never>
  'unity/no-debug-log':                         Record<never, never>
  'unity/no-find-object-of-type':               Record<never, never>
  'unity/no-new-texture2d':                     Record<never, never>
  'unity/no-task-delay':                        { extraBannedMethods?: string[] }
  'unity/no-string-split':                      Record<never, never>
  'unity/no-trim-char':                         Record<never, never>
  'unity/no-raw-tostring-number':               Record<never, never>
  'unity/no-async-lambda-into-syncrunner':      Record<never, never>
  'violations-meta/no-dead-rule-scope':         { ruleFiles: string[]; projectRoot?: string }
  'violations-meta/no-rule-without-test':       { ruleFiles: string[] }
  'violations-meta/no-inline-walk':             { ruleFiles: string[] }
  'violations-meta/no-legacy-violations-folder': { projectRoot: string }
}

// Local rule paths are relative strings (e.g. './.violations/rules/my-rule.js').
// Cannot be typed statically, so they accept the base override shape only.
type LocalRulePath = `./${string}`

export type ViolationsConfig = {
  projectTags: string[]
  globalExclude?: string[]
  rules?: {
    [K in keyof RuleConfigMap]?: RuleOverride<RuleConfigMap[K]> | true
  } & {
    [K in LocalRulePath]?: RuleOverride | true
  }
}

export type RuleResult = {
  ruleId: string
  severity: Severity
  violations: Violation[]
  suppressed: Violation[]
  counts: {
    violations: number
    suppressed: number
  }
}

export type SuppressDirective =
  | {
      kind: 'inline'
      ruleId: string
      reason?: string
      // the line bearing (or immediately above) the directive comment
      line: number
    }
  | {
      kind: 'start'
      ruleId: string
      reason?: string
      line: number
    }
  | {
      kind: 'end'
      ruleId: string
      line: number
    }

export type CacheManifest = {
  // semver of wadeck-violations-cli at time of last compile
  frameworkVersion: string
  files: Record<
    string, // absolute path to source .ts rule file
    {
      // mtime at last compile - stale if current mtime differs
      mtimeMs: number
      // absolute path to the compiled .js output in .cache/
      compiledPath: string
    }
  >
}
