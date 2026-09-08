import { ConfigurationContext } from "@nkdk/runtime"
import { callAtomicFromYAML, PropertyRule, definePropertyTypeRule } from "../../../ruleRuntime"
import { AppearanceFieldsRules } from "./rules"
import type { AppearanceFields, AppearanceFieldsYAML } from "./types"
import { normalizeAppearanceFieldsStringYAML } from "./stringValues"

const importAppearanceFromYAML = (
  context: ConfigurationContext,
  _rule: PropertyRule | undefined,
  yaml: AppearanceFieldsYAML | undefined,
): AppearanceFields | undefined => {
  if (!yaml) return undefined
  const normalizedYAML = normalizeAppearanceFieldsStringYAML(yaml) as AppearanceFieldsYAML
  const imported = Object.fromEntries(
    Object.entries(AppearanceFieldsRules.properties).flatMap(([propertyKey, propertyRule]) => {
      const yamlKey = propertyRule.yaml
      if (yamlKey === undefined || !Object.prototype.hasOwnProperty.call(normalizedYAML, yamlKey)) return []
      const value = callAtomicFromYAML({
        context,
        rule: propertyRule,
        value: normalizedYAML[yamlKey as keyof AppearanceFieldsYAML],
      })
      return value === undefined ? [] : [[propertyKey, value]]
    })
  )
  return { itemType: AppearanceFieldsRules.itemType, ...imported } as AppearanceFields
}

export const metadataPropertyRule000 = definePropertyTypeRule("AppearanceFields", "importFromYAML", importAppearanceFromYAML)
