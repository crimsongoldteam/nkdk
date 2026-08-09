import { ConfigurationContext } from "../../../context/types"
import { callAtomicFromYAML, PropertyRule, registerTypeRule } from "../../../ruleRuntime"
import { AppearanceFieldsRules } from "./rules"
import type { AppearanceFields, AppearanceFieldsYAML } from "./types"
import { normalizeAppearanceFieldsStringYAML } from "./stringValues"

const importAppearanceFromYAML = (
  context: ConfigurationContext,
  _rule: PropertyRule | undefined,
  yaml: AppearanceFieldsYAML | undefined,
  source?: AppearanceFields
): AppearanceFields | undefined => {
  if (!yaml) return undefined
  const normalizedYAML = normalizeAppearanceFieldsStringYAML(yaml) as AppearanceFieldsYAML
  const imported = Object.fromEntries(
    Object.entries(AppearanceFieldsRules.properties).flatMap(([propertyKey, propertyRule]) => {
      const yamlKey = propertyRule.yaml
      if (yamlKey === undefined || !Object.prototype.hasOwnProperty.call(normalizedYAML, yamlKey)) return []
      const isAppearanceString = propertyKey === "Текст" || propertyKey === "Формат"
      const value = callAtomicFromYAML({
        context,
        rule: propertyRule,
        value: normalizedYAML[yamlKey as keyof AppearanceFieldsYAML],
        referenceValue: isAppearanceString ? undefined : source?.[propertyKey as keyof AppearanceFields],
      })
      return value === undefined ? [] : [[propertyKey, value]]
    })
  )
  return { itemType: AppearanceFieldsRules.itemType, ...imported } as AppearanceFields
}

registerTypeRule("AppearanceFields", "importFromYAML", importAppearanceFromYAML)
