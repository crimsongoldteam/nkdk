import { ConfigurationContext } from "../../../context/types"
import { callAtomicFromYAML, PropertyRule, registerTypeRule } from "../../../orchestration"
import { AppearanceFieldsRules } from "./rules"
import type { AppearanceFields, AppearanceFieldsYAML } from "./types"

const importAppearanceFromYAML = (
  context: ConfigurationContext,
  _rule: PropertyRule | undefined,
  yaml: AppearanceFieldsYAML | undefined,
  source?: AppearanceFields
): AppearanceFields | undefined => {
  if (!yaml) return undefined
  const imported = Object.fromEntries(
    Object.entries(AppearanceFieldsRules.properties).flatMap(([propertyKey, propertyRule]) => {
      const yamlKey = propertyRule.yaml
      if (yamlKey === undefined || !Object.prototype.hasOwnProperty.call(yaml, yamlKey)) return []
      const value = callAtomicFromYAML({
        context,
        rule: propertyRule,
        value: yaml[yamlKey as keyof AppearanceFieldsYAML],
        referenceValue: source?.[propertyKey as keyof AppearanceFields],
      })
      return value === undefined ? [] : [[propertyKey, value]]
    })
  )
  return { itemType: AppearanceFieldsRules.itemType, ...imported } as AppearanceFields
}

registerTypeRule("AppearanceFields", "importFromYAML", importAppearanceFromYAML)
