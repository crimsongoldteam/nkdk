import type { MetadataItemRule } from "../../ruleRuntime"
import { projectClientApplicationBaseForm } from "./baseFormProjection"
import { equalBaseFormYaml } from "./baseFormYaml"
import type { ClientApplicationFormYAML } from "./types"

export function isRedundantClientApplicationBaseForm(params: {
  readonly currentConfigurationYaml: ClientApplicationFormYAML
  readonly extensionYaml: ClientApplicationFormYAML
  readonly savedBaseYaml: ClientApplicationFormYAML
  readonly rule?: MetadataItemRule
}): boolean {
  const common = {
    extensionYaml: params.extensionYaml,
    ...(params.rule === undefined ? {} : { rule: params.rule }),
  }
  const expected = projectClientApplicationBaseForm({
    ...common,
    baseYaml: params.currentConfigurationYaml,
  })
  const saved = projectClientApplicationBaseForm({
    ...common,
    baseYaml: params.savedBaseYaml,
  })
  return equalBaseFormYaml(saved.yaml, expected.yaml)
}
