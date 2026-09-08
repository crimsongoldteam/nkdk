import type { MetadataItemRule } from "../../ruleRuntime"
import { equalClientApplicationBaseFormProjections } from "./baseFormProjection"
import type { ClientApplicationFormYAML } from "./types"

export function isRedundantClientApplicationBaseForm(params: {
  readonly currentConfigurationYaml: ClientApplicationFormYAML
  readonly extensionYaml: ClientApplicationFormYAML
  readonly savedBaseYaml: ClientApplicationFormYAML
  readonly rule?: MetadataItemRule
}): boolean {
  return equalClientApplicationBaseFormProjections({
    leftBaseYaml: params.currentConfigurationYaml,
    rightBaseYaml: params.savedBaseYaml,
    extensionYaml: params.extensionYaml,
    ...(params.rule === undefined ? {} : { rule: params.rule }),
  })
}
