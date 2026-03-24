import type { ConfigurationContext } from "~/metadata/context/types"
import { importPropertiesFromYAML } from "~/metadata/orchestration"
import { AppearanceFieldsRules } from "./rules"
import type { AppearanceFields, AppearanceFieldsYAML } from "./types"

export const importAppearanceFieldsFromYAML = (
  context: ConfigurationContext,
  yaml: AppearanceFieldsYAML
): AppearanceFields => {
  return importPropertiesFromYAML({
    context,
    yaml,
    metadataRule: AppearanceFieldsRules,
  }) as AppearanceFields
}
