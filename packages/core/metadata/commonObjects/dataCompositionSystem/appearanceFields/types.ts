import { FormTypeByRule } from "~/metadata/orchestration/metadataItem/element"
import { YAMLTypeByRule } from "~/metadata/orchestration/metadataItem/yaml"
import type { ConfigurationContext, ConfigurationContextFromXML } from "~/metadata/context/types"
import { registerTypeRule } from "~/metadata/orchestration/formElement/factory"
import type { PropertyRule } from "~/metadata/orchestration/property/types"
import type {
  ParameterValueXML,
  SettingsParameterValue,
  SettingsParameterValuePropertyRule,
  SettingsParameterValueYAML,
} from "../parameterValue/types"
import { importParameterValueFromDcsXML } from "../parameterValue/fromDcsXML"
import { exportParameterValueToDcsXML } from "../parameterValue/toDcsXML"
import { importParameterValueFromYAML } from "../parameterValue/fromYAML"
import { exportParameterValueToYAML } from "../parameterValue/toYAML"
import { AppearanceFieldsRules } from "./rules"

export type AppearanceFields = FormTypeByRule<typeof AppearanceFieldsRules>

export type AppearanceFieldsYAML = YAMLTypeByRule<typeof AppearanceFieldsRules>

export type AppearanceFieldsXML = {
  "dcscor:item"?: ParameterValueXML | ParameterValueXML[]
}

const asArray = <T>(value: T | T[] | undefined): T[] => {
  if (value === undefined) return []
  return Array.isArray(value) ? value : [value]
}

const appearanceEntries = Object.entries(AppearanceFieldsRules.properties)
const appearanceRulesByParameter = Object.fromEntries(appearanceEntries) as Record<
  string,
  SettingsParameterValuePropertyRule
>

registerTypeRule(
  "Appearance",
  "importFromXML",
  (context: ConfigurationContextFromXML, _rule: PropertyRule | undefined, value: unknown): AppearanceFields | undefined => {
    const xml = value as AppearanceFieldsXML | undefined
    if (!xml) return undefined

    const result: AppearanceFields = { itemType: AppearanceFieldsRules.itemType }
    for (const item of asArray(xml["dcscor:item"])) {
      const parameter = item["dcscor:parameter"]
      const propertyRule = appearanceRulesByParameter[parameter]
      if (!propertyRule) continue
      ;(result as Record<string, unknown>)[parameter] = importParameterValueFromDcsXML(context, propertyRule, item)
    }

    return Object.keys(result).length > 1 ? result : undefined
  }
)

registerTypeRule(
  "Appearance",
  "exportToXML",
  (context: ConfigurationContext, _rule: PropertyRule | undefined, value: unknown): AppearanceFieldsXML | undefined => {
    const data = value as AppearanceFields | undefined
    if (!data) return undefined

    const items = appearanceEntries.flatMap(([propertyName, propertyRule]) => {
      const item = (data as unknown as Record<string, SettingsParameterValue | undefined>)[propertyName]
      if (!item) return []
      return [
        exportParameterValueToDcsXML({
          context,
          rule: propertyRule as SettingsParameterValuePropertyRule,
          data: item,
          rootSettingsXsi: true,
        }),
      ]
    })

    if (items.length === 0) return undefined
    return { "dcscor:item": items.length === 1 ? items[0] : items }
  }
)

registerTypeRule(
  "Appearance",
  "importFromYAML",
  (context: ConfigurationContext, _rule: PropertyRule | undefined, value: unknown): AppearanceFields | undefined => {
    const yaml = value as Record<string, SettingsParameterValueYAML> | undefined
    if (!yaml || typeof yaml !== "object") return undefined

    const result: AppearanceFields = { itemType: AppearanceFieldsRules.itemType }
    for (const [propertyName, propertyRule] of appearanceEntries) {
      const yamlKey = propertyRule.yaml
      const yamlValue = yaml[yamlKey]
      if (yamlValue === undefined) continue
      ;(result as Record<string, unknown>)[propertyName] = importParameterValueFromYAML(
        context,
        propertyRule as SettingsParameterValuePropertyRule,
        yamlValue
      )
    }

    return Object.keys(result).length > 1 ? result : undefined
  }
)

registerTypeRule(
  "Appearance",
  "exportToYAML",
  (context: ConfigurationContext, _rule: PropertyRule | undefined, value: unknown): AppearanceFieldsYAML | undefined => {
    const data = value as AppearanceFields | undefined
    if (!data) return undefined

    const result: Record<string, unknown> = {}
    for (const [propertyName, propertyRule] of appearanceEntries) {
      const item = (data as unknown as Record<string, SettingsParameterValue | undefined>)[propertyName]
      if (!item) continue
      result[propertyRule.yaml] = exportParameterValueToYAML({
        context,
        rule: propertyRule as SettingsParameterValuePropertyRule,
        data: item,
      })
    }

    return Object.keys(result).length > 0 ? (result as AppearanceFieldsYAML) : undefined
  }
)
