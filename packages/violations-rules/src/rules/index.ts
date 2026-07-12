export { rule as noEmDash } from './shared/no-em-dash.js'
export { rule as noFrench } from './shared/no-french.js'
export { rule as partialImplFlag } from './shared/partial-impl-flag.js'
export { rule as readmeSystemLength } from './shared/readme-system-length.js'
export { rule as noDeadSuppress } from './shared/no-dead-suppress.js'
export { rule as noDeadRuleScope } from './violations-meta/no-dead-rule-scope.js'
export { rule as noRuleWithoutTest } from './violations-meta/no-rule-without-test.js'
export { rule as noLegacyViolationsFolder } from './violations-meta/no-legacy-violations-folder.js'
export { rule as noExportStar } from './ts/no-export-star.js'
export { rule as noErrMessageDirect } from './ts/no-err-message-direct.js'
export { rule as noUnionWithString } from './ts/no-union-with-string.js'
export { rule as noSwitchDefaultBreak } from './ts/no-switch-default-break.js'
export { rule as noLocaleDate } from './ts/no-locale-date.js'
export { rule as noCrossPackageRelative } from './ts/no-cross-package-relative.js'
export { rule as noBarrelIndex } from './ts/no-barrel-index.js'
export { rule as noSingleFileFolder } from './ts/no-single-file-folder.js'
export { rule as noInlineSubcomponent } from './ts/no-inline-subcomponent.js'
export { rule as noUnsafeTypeCast } from './ts/no-unsafe-type-cast.js'
export { rule as noRawButton } from './react/no-raw-button.js'
export { rule as noRawInput } from './react/no-raw-input.js'
export { rule as noInlineSvg } from './react/no-inline-svg.js'
export { rule as noContextInRenderer } from './react/no-context-in-renderer.js'
export { rule as noRawColorClass } from './tailwind/no-raw-color-class.js'
export { rule as noInlineClassname } from './tailwind/no-inline-classname.js'
export { rule as noButtonClassnameStyleOverride } from './tailwind/no-button-classname-style-override.js'
export { rule as csNoNamespace } from './cs/no-namespace.js'
export { rule as csNoRedundantFqn } from './cs/no-redundant-fqn.js'
export { rule as csNoXmlDocSummary } from './cs/no-xml-doc-summary.js'
export { rule as csConstFieldPascalCase } from './cs/const-field-pascal-case.js'
export { rule as csNoRawException } from './cs/no-raw-exception.js'
export { rule as csNoLinqImport } from './cs/no-linq-import.js'
export { rule as csNoTaskWait } from './cs/no-task-wait.js'
export { rule as csNoArrowBody } from './cs/no-arrow-body.js'
export { rule as csNoMultilineCommentBeforeClass } from './cs/no-multiline-comment-before-class.js'
export { rule as csTestFileLocation } from './cs/test-file-location.js'
export { rule as unityLogicNoUnityUsing } from './unity/logic-no-unity-using.js'
export { rule as unityNoMissingUnityApi } from './unity/no-missing-unity-api.js'
export { rule as unityNoDebugLog } from './unity/no-debug-log.js'
export { rule as unityNoFindObjectOfType } from './unity/no-find-object-of-type.js'
export { rule as unityNoNewTexture2d } from './unity/no-new-texture2d.js'
export { rule as unityNoTaskDelay } from './unity/no-task-delay.js'
export { rule as unityNoStringSplit } from './unity/no-string-split.js'
export { rule as unityNoTrimChar } from './unity/no-trim-char.js'
export { rule as unityNoRawTostringNumber } from './unity/no-raw-tostring-number.js'
export { rule as unityListenerRegisterSymmetry } from './unity/listener-register-symmetry.js'

export type { Config as NoEmDashConfig } from './shared/no-em-dash.js'
export type { Config as NoFrenchConfig } from './shared/no-french.js'
export type { Config as PartialImplFlagConfig } from './shared/partial-impl-flag.js'
export type { Config as ReadmeSystemLengthConfig } from './shared/readme-system-length.js'
export type { Config as NoDeadSuppressConfig } from './shared/no-dead-suppress.js'
export type { Config as NoDeadRuleScopeConfig } from './violations-meta/no-dead-rule-scope.js'
export type { Config as NoRuleWithoutTestConfig } from './violations-meta/no-rule-without-test.js'
export type { Config as NoLegacyViolationsFolderConfig } from './violations-meta/no-legacy-violations-folder.js'
export type { Config as NoExportStarConfig } from './ts/no-export-star.js'
export type { Config as NoErrMessageDirectConfig } from './ts/no-err-message-direct.js'
export type { Config as NoUnionWithStringConfig } from './ts/no-union-with-string.js'
export type { Config as NoSwitchDefaultBreakConfig } from './ts/no-switch-default-break.js'
export type { Config as NoLocaleDateConfig } from './ts/no-locale-date.js'
export type { Config as NoCrossPackageRelativeConfig } from './ts/no-cross-package-relative.js'
export type { Config as NoBarrelIndexConfig } from './ts/no-barrel-index.js'
export type { Config as NoSingleFileFolderConfig } from './ts/no-single-file-folder.js'
export type { Config as NoInlineSubcomponentConfig } from './ts/no-inline-subcomponent.js'
export type { Config as NoUnsafeTypeCastConfig } from './ts/no-unsafe-type-cast.js'
export type { Config as NoRawButtonConfig } from './react/no-raw-button.js'
export type { Config as NoRawInputConfig } from './react/no-raw-input.js'
export type { Config as NoInlineSvgConfig } from './react/no-inline-svg.js'
export type { Config as NoContextInRendererConfig } from './react/no-context-in-renderer.js'
export type { Config as NoRawColorClassConfig } from './tailwind/no-raw-color-class.js'
export type { Config as NoInlineClassnameConfig } from './tailwind/no-inline-classname.js'
export type { Config as NoButtonClassnameStyleOverrideConfig } from './tailwind/no-button-classname-style-override.js'
export type { Config as CsNoNamespaceConfig } from './cs/no-namespace.js'
export type { Config as CsNoRedundantFqnConfig } from './cs/no-redundant-fqn.js'
export type { Config as CsNoXmlDocSummaryConfig } from './cs/no-xml-doc-summary.js'
export type { Config as CsConstFieldPascalCaseConfig } from './cs/const-field-pascal-case.js'
export type { Config as CsNoRawExceptionConfig } from './cs/no-raw-exception.js'
export type { Config as CsNoLinqImportConfig } from './cs/no-linq-import.js'
export type { Config as CsNoTaskWaitConfig } from './cs/no-task-wait.js'
export type { Config as CsNoArrowBodyConfig } from './cs/no-arrow-body.js'
export type { Config as CsNoMultilineCommentBeforeClassConfig } from './cs/no-multiline-comment-before-class.js'
export type { Config as CsTestFileLocationConfig } from './cs/test-file-location.js'
export type { Config as UnityLogicNoUnityUsingConfig } from './unity/logic-no-unity-using.js'
export type { Config as UnityNoMissingUnityApiConfig } from './unity/no-missing-unity-api.js'
export type { Config as UnityNoDebugLogConfig } from './unity/no-debug-log.js'
export type { Config as UnityNoFindObjectOfTypeConfig } from './unity/no-find-object-of-type.js'
export type { Config as UnityNoNewTexture2dConfig } from './unity/no-new-texture2d.js'
export type { Config as UnityNoTaskDelayConfig } from './unity/no-task-delay.js'
export type { Config as UnityNoStringSplitConfig } from './unity/no-string-split.js'
export type { Config as UnityNoTrimCharConfig } from './unity/no-trim-char.js'
export type { Config as UnityNoRawTostringNumberConfig } from './unity/no-raw-tostring-number.js'
export type { Config as UnityListenerRegisterSymmetryConfig } from './unity/listener-register-symmetry.js'

import { rule as noEmDash } from './shared/no-em-dash.js'
import { rule as noFrench } from './shared/no-french.js'
import { rule as partialImplFlag } from './shared/partial-impl-flag.js'
import { rule as readmeSystemLength } from './shared/readme-system-length.js'
import { rule as noDeadSuppress } from './shared/no-dead-suppress.js'
import { rule as noDeadRuleScope } from './violations-meta/no-dead-rule-scope.js'
import { rule as noRuleWithoutTest } from './violations-meta/no-rule-without-test.js'
import { rule as noLegacyViolationsFolder } from './violations-meta/no-legacy-violations-folder.js'
import { rule as noExportStar } from './ts/no-export-star.js'
import { rule as noErrMessageDirect } from './ts/no-err-message-direct.js'
import { rule as noUnionWithString } from './ts/no-union-with-string.js'
import { rule as noSwitchDefaultBreak } from './ts/no-switch-default-break.js'
import { rule as noLocaleDate } from './ts/no-locale-date.js'
import { rule as noCrossPackageRelative } from './ts/no-cross-package-relative.js'
import { rule as noBarrelIndex } from './ts/no-barrel-index.js'
import { rule as noSingleFileFolder } from './ts/no-single-file-folder.js'
import { rule as noInlineSubcomponent } from './ts/no-inline-subcomponent.js'
import { rule as noUnsafeTypeCast } from './ts/no-unsafe-type-cast.js'
import { rule as noRawButton } from './react/no-raw-button.js'
import { rule as noRawInput } from './react/no-raw-input.js'
import { rule as noInlineSvg } from './react/no-inline-svg.js'
import { rule as noContextInRenderer } from './react/no-context-in-renderer.js'
import { rule as noRawColorClass } from './tailwind/no-raw-color-class.js'
import { rule as noInlineClassname } from './tailwind/no-inline-classname.js'
import { rule as noButtonClassnameStyleOverride } from './tailwind/no-button-classname-style-override.js'
import { rule as csNoNamespace } from './cs/no-namespace.js'
import { rule as csNoRedundantFqn } from './cs/no-redundant-fqn.js'
import { rule as csNoXmlDocSummary } from './cs/no-xml-doc-summary.js'
import { rule as csConstFieldPascalCase } from './cs/const-field-pascal-case.js'
import { rule as csNoRawException } from './cs/no-raw-exception.js'
import { rule as csNoLinqImport } from './cs/no-linq-import.js'
import { rule as csNoTaskWait } from './cs/no-task-wait.js'
import { rule as csNoArrowBody } from './cs/no-arrow-body.js'
import { rule as csNoMultilineCommentBeforeClass } from './cs/no-multiline-comment-before-class.js'
import { rule as csTestFileLocation } from './cs/test-file-location.js'
import { rule as unityLogicNoUnityUsing } from './unity/logic-no-unity-using.js'
import { rule as unityNoMissingUnityApi } from './unity/no-missing-unity-api.js'
import { rule as unityNoDebugLog } from './unity/no-debug-log.js'
import { rule as unityNoFindObjectOfType } from './unity/no-find-object-of-type.js'
import { rule as unityNoNewTexture2d } from './unity/no-new-texture2d.js'
import { rule as unityNoTaskDelay } from './unity/no-task-delay.js'
import { rule as unityNoStringSplit } from './unity/no-string-split.js'
import { rule as unityNoTrimChar } from './unity/no-trim-char.js'
import { rule as unityNoRawTostringNumber } from './unity/no-raw-tostring-number.js'
import { rule as unityListenerRegisterSymmetry } from './unity/listener-register-symmetry.js'
import type { Rule } from '../types.js'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const allRules: Rule<any>[] = [
  noEmDash,
  noFrench,
  partialImplFlag,
  readmeSystemLength,
  noDeadSuppress,
  noDeadRuleScope,
  noRuleWithoutTest,
  noLegacyViolationsFolder,
  noExportStar,
  noErrMessageDirect,
  noUnionWithString,
  noSwitchDefaultBreak,
  noLocaleDate,
  noCrossPackageRelative,
  noBarrelIndex,
  noSingleFileFolder,
  noInlineSubcomponent,
  noUnsafeTypeCast,
  noRawButton,
  noRawInput,
  noInlineSvg,
  noContextInRenderer,
  noRawColorClass,
  noInlineClassname,
  noButtonClassnameStyleOverride,
  csNoNamespace,
  csNoRedundantFqn,
  csNoXmlDocSummary,
  csConstFieldPascalCase,
  csNoRawException,
  csNoLinqImport,
  csNoTaskWait,
  csNoArrowBody,
  csNoMultilineCommentBeforeClass,
  csTestFileLocation,
  unityLogicNoUnityUsing,
  unityNoMissingUnityApi,
  unityNoDebugLog,
  unityNoFindObjectOfType,
  unityNoNewTexture2d,
  unityNoTaskDelay,
  unityNoStringSplit,
  unityNoTrimChar,
  unityNoRawTostringNumber,
  unityListenerRegisterSymmetry,
]
