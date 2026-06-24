import { ConfigurationContext } from "~/metadata/context/types"
import { importPropertiesFromYAML, PropertyRule, registerTypeRule } from "~/metadata/orchestration"
import { AppearanceFieldsRules } from "./rules"
import type { AppearanceFields, AppearanceFieldsYAML } from "./types"

const importAppearanceFromYAML = (
  context: ConfigurationContext,
  _rule: PropertyRule | undefined,
  yaml: AppearanceFieldsYAML | undefined,
  source?: AppearanceFields
): AppearanceFields | undefined => {
  if (!yaml) return undefined
  return importPropertiesFromYAML({
    context,
    yaml,
    metadataRule: AppearanceFieldsRules,
    source,
  })
}

registerTypeRule("AppearanceFields", "importFromYAML", importAppearanceFromYAML)
